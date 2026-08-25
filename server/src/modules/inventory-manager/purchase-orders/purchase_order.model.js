import { tenantClientQuery, tenantQuery, withTransaction } from '../../../config/db.js'
import { MOVEMENT_TYPES, PURCHASE_ORDER_STATUS } from '../../../config/constants.js'
import { insertLedgerEventInTx } from '../control/control.model.js'
import { buildPurchaseOrderSms, sendSms } from '../../../utils/sms.util.js'

function httpError(status, message) {
  const error = new Error(message)
  error.status = status
  return error
}

export async function listPurchaseOrders(tenantId, { q, supplierId, status, page = 1, limit = 8 } = {}) {
  const safePage = Math.max(1, Number(page) || 1)
  const safeLimit = Math.min(50, Math.max(1, Number(limit) || 8))
  const offset = (safePage - 1) * safeLimit

  const { rows } = await tenantQuery(
    tenantId,
    `
      SELECT
        po.id,
        po.order_number AS "orderNumber",
        po.status,
        po.explanation,
        po.created_at AS "createdAt",
        s.company_name AS "companyName",
        s.representative_name AS "representativeName",
        s.representative_phone AS "representativePhone",
        count(poi.id)::int AS "itemsNumber",
        count(*) OVER()::int AS "_total"
      FROM purchase_orders po
      JOIN suppliers s ON s.id = po.supplier_id AND s.tenant_id = po.tenant_id
      LEFT JOIN purchase_order_items poi ON poi.purchase_order_id = po.id AND poi.tenant_id = po.tenant_id
      WHERE po.tenant_id = $1
        AND ($2::text IS NULL OR po.order_number ILIKE '%' || $2 || '%' OR s.company_name ILIKE '%' || $2 || '%')
        AND ($3::uuid IS NULL OR po.supplier_id = $3)
        AND ($4::text IS NULL OR po.status = $4)
      GROUP BY po.id, s.company_name, s.representative_name, s.representative_phone
      ORDER BY po.created_at DESC
      LIMIT $5 OFFSET $6
    `,
    [q || null, supplierId || null, status || null, safeLimit, offset],
  )

  const total = rows[0]?._total || 0
  const items = rows.map(({ _total, ...item }) => item)
  return { items, total, page: safePage, limit: safeLimit }
}

export async function getPurchaseOrderById(tenantId, id) {
  const { rows: orders } = await tenantQuery(
    tenantId,
    `
      SELECT
        po.id,
        po.order_number AS "orderNumber",
        po.status,
        po.explanation,
        po.created_at AS "createdAt",
        s.id AS "supplierId",
        s.company_name AS "companyName",
        s.representative_name AS "representativeName",
        s.representative_phone AS "representativePhone",
        s.company_phone AS "companyPhone"
      FROM purchase_orders po
      JOIN suppliers s ON s.id = po.supplier_id AND s.tenant_id = po.tenant_id
      WHERE po.tenant_id = $1 AND po.id = $2
      LIMIT 1
    `,
    [id],
  )
  const order = orders[0]
  if (!order) return null

  const { rows: lines } = await tenantQuery(
    tenantId,
    `
      SELECT
        poi.id,
        poi.product_id AS "productId",
        p.name,
        p.item_code AS "itemCode",
        poi.scale,
        poi.quantity,
        poi.unit_cost AS "unitCost",
        poi.last_purchase_price AS "lastPurchasePrice"
      FROM purchase_order_items poi
      JOIN products p ON p.id = poi.product_id AND p.tenant_id = poi.tenant_id
      WHERE poi.tenant_id = $1 AND poi.purchase_order_id = $2
      ORDER BY p.name
    `,
    [id],
  )

  return { ...order, lines }
}

export async function generatePurchaseOrder(tenantId, payload) {
  const orderId = await withTransaction(async (client) => {
    const { rows: suppliers } = await tenantClientQuery(
      client,
      tenantId,
      `
        SELECT id, is_active AS "isActive"
        FROM suppliers
        WHERE tenant_id = $1 AND id = $2
        LIMIT 1
      `,
      [payload.supplierId],
    )
    if (!suppliers[0]) throw httpError(404, 'Supplier not found')
    if (!suppliers[0].isActive) {
      throw httpError(409, 'Supplier is inactive and cannot be used for new orders')
    }

    const lines = Array.isArray(payload.lines) ? payload.lines : []
    const productIds = lines.map((line) => line.productId)
    const { rows: products } = await tenantClientQuery(
      client,
      tenantId,
      `
        SELECT id, purchase_price AS "purchasePrice", status
        FROM products
        WHERE tenant_id = $1 AND id = ANY($2::uuid[])
      `,
      [productIds],
    )
    const priceById = new Map(products.map((row) => [row.id, row.purchasePrice]))
    for (const line of lines) {
      if (!priceById.has(line.productId)) {
        throw httpError(404, `Product not found: ${line.productId}`)
      }
      const product = products.find((row) => row.id === line.productId)
      if (product?.status === 'inactive') {
        throw httpError(409, 'Cannot add inactive products to a new purchase order')
      }
    }

    const orderNumber = `PO-${Date.now().toString(36).toUpperCase()}`
    const { rows: orders } = await tenantClientQuery(
      client,
      tenantId,
      `
        INSERT INTO purchase_orders (
          tenant_id, supplier_id, order_number, explanation, status, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, order_number AS "orderNumber", status
      `,
      [payload.supplierId, orderNumber, payload.explanation || null, PURCHASE_ORDER_STATUS.PENDING, payload.createdBy],
    )
    const order = orders[0]

    if (lines.length) {
      await tenantClientQuery(
        client,
        tenantId,
        `
          INSERT INTO purchase_order_items (
            tenant_id, purchase_order_id, product_id, scale, quantity, unit_cost, last_purchase_price
          )
          SELECT $1, $2, x.product_id, x.scale, x.quantity, x.unit_cost, x.last_purchase_price
          FROM unnest(
            $3::uuid[],
            $4::text[],
            $5::numeric[],
            $6::numeric[],
            $7::numeric[]
          ) AS x(product_id, scale, quantity, unit_cost, last_purchase_price)
        `,
        [
          order.id,
          productIds,
          lines.map((line) => line.scale),
          lines.map((line) => line.quantity),
          lines.map((line) => line.unitCost),
          lines.map((line) => priceById.get(line.productId)),
        ],
      )
    }

    return order.id
  })

  return getPurchaseOrderById(tenantId, orderId)
}

export async function priceHistory(tenantId, id) {
  const order = await getPurchaseOrderById(tenantId, id)
  if (!order) return null

  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    companyName: order.companyName,
    lines: order.lines.map((line) => {
      const last = Number(line.lastPurchasePrice ?? 0)
      const current = Number(line.unitCost ?? 0)
      let direction = 'same'
      if (current > last) direction = 'up'
      if (current < last) direction = 'down'
      return {
        productId: line.productId,
        name: line.name,
        itemCode: line.itemCode,
        scale: line.scale,
        lastPurchasePrice: last,
        currentPurchasePrice: current,
        direction,
      }
    }),
  }
}

export async function receivePurchaseOrder(tenantId, purchaseOrderId, userId) {
  return withTransaction(async (client) => {
    const { rows: orders } = await tenantClientQuery(
      client,
      tenantId,
      `
        SELECT id, order_number AS "orderNumber", supplier_id AS "supplierId", status
        FROM purchase_orders
        WHERE tenant_id = $1 AND id = $2
        FOR UPDATE
      `,
      [purchaseOrderId],
    )
    const order = orders[0]
    if (!order) throw httpError(404, 'Purchase order not found')
    if (order.status === PURCHASE_ORDER_STATUS.RECEIVED) {
      throw httpError(409, 'Purchase order already received')
    }
    if (order.status === PURCHASE_ORDER_STATUS.CANCELLED) {
      throw httpError(409, 'Cannot stock-in a cancelled purchase order')
    }
    if (order.status !== PURCHASE_ORDER_STATUS.APPROVED) {
      throw httpError(400, 'Purchase order must be approved before stock-in')
    }

    const { rows: lines } = await tenantClientQuery(
      client,
      tenantId,
      `
        SELECT product_id AS "productId", scale, quantity, unit_cost AS "unitCost"
        FROM purchase_order_items
        WHERE tenant_id = $1 AND purchase_order_id = $2
      `,
      [purchaseOrderId],
    )
    if (!lines.length) throw httpError(422, 'Purchase order has no items')

    const saved = []
    for (const line of lines) {
      saved.push(
        await insertLedgerEventInTx(client, tenantId, {
          productId: line.productId,
          movementType: MOVEMENT_TYPES.IN,
          quantity: line.quantity,
          scale: line.scale,
          supplierId: order.supplierId,
          purchaseOrderId,
          unitCost: line.unitCost,
          reason: `PO ${order.orderNumber}`,
          createdBy: userId,
        }),
      )
    }

    await tenantClientQuery(
      client,
      tenantId,
      `
        UPDATE purchase_orders
        SET status = $3
        WHERE tenant_id = $1 AND id = $2 AND status = $4
      `,
      [purchaseOrderId, PURCHASE_ORDER_STATUS.RECEIVED, PURCHASE_ORDER_STATUS.APPROVED],
    )

    return { purchaseOrderId, orderNumber: order.orderNumber, status: PURCHASE_ORDER_STATUS.RECEIVED, lines: saved }
  })
}

export async function cancelPurchaseOrder(tenantId, id) {
  const { rows: existingRows } = await tenantQuery(
    tenantId,
    `
      SELECT id, status
      FROM purchase_orders
      WHERE tenant_id = $1 AND id = $2
      LIMIT 1
    `,
    [id],
  )
  const existing = existingRows[0]
  if (!existing) return null
  if (existing.status !== PURCHASE_ORDER_STATUS.PENDING) {
    throw httpError(400, 'Only pending purchase orders can be cancelled')
  }

  const { rows } = await tenantQuery(
    tenantId,
    `
      UPDATE purchase_orders
      SET status = $3
      WHERE tenant_id = $1 AND id = $2 AND status = $4
      RETURNING id, order_number AS "orderNumber", status
    `,
    [id, PURCHASE_ORDER_STATUS.CANCELLED, PURCHASE_ORDER_STATUS.PENDING],
  )
  return rows[0] || null
}

export async function approvePurchaseOrder(tenantId, id, userId) {
  const { rows: existingRows } = await tenantQuery(
    tenantId,
    `
      SELECT id, status
      FROM purchase_orders
      WHERE tenant_id = $1 AND id = $2
      LIMIT 1
    `,
    [id],
  )
  const existing = existingRows[0]
  if (!existing) return null
  if (existing.status !== PURCHASE_ORDER_STATUS.PENDING) {
    throw httpError(400, 'Only pending purchase orders can be approved')
  }

  const { rows } = await tenantQuery(
    tenantId,
    `
      UPDATE purchase_orders
      SET status = $3, approved_by = $4, approved_at = now()
      WHERE tenant_id = $1 AND id = $2 AND status = $5
      RETURNING id, order_number AS "orderNumber", status, approved_at AS "approvedAt"
    `,
    [id, PURCHASE_ORDER_STATUS.APPROVED, userId, PURCHASE_ORDER_STATUS.PENDING],
  )
  return rows[0] || null
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

export async function buildPurchaseOrderPrint(tenantId, id) {
  const order = await getPurchaseOrderById(tenantId, id)
  if (!order) return null

  const lineRows = order.lines
    .map(
      (line) => `
        <tr>
          <td>${escapeHtml(line.name)} (${escapeHtml(line.itemCode)})</td>
          <td>${escapeHtml(line.scale)}</td>
          <td>${escapeHtml(line.quantity)}</td>
          <td>${escapeHtml(line.unitCost)}</td>
        </tr>
      `,
    )
    .join('')

  const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Purchase Order ${escapeHtml(order.orderNumber)}</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 24px; color: #111; }
      h1 { margin-bottom: 4px; }
      table { width: 100%; border-collapse: collapse; margin-top: 20px; }
      th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
      th { background: #f5f5f5; }
    </style>
  </head>
  <body>
    <h1>Purchase Order ${escapeHtml(order.orderNumber)}</h1>
    <p><strong>Company:</strong> ${escapeHtml(order.companyName)}</p>
    <p><strong>Representative:</strong> ${escapeHtml(order.representativeName)} (${escapeHtml(order.representativePhone)})</p>
    <p><strong>Status:</strong> ${escapeHtml(order.status)}</p>
    ${order.explanation ? `<p><strong>Explanation:</strong> ${escapeHtml(order.explanation)}</p>` : ''}
    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th>Scale</th>
          <th>Quantity</th>
          <th>Unit Cost</th>
        </tr>
      </thead>
      <tbody>${lineRows}</tbody>
    </table>
  </body>
</html>`

  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    companyName: order.companyName,
    status: order.status,
    lines: order.lines,
    html,
  }
}

export async function sendPurchaseOrderSms(tenantId, id) {
  const order = await getPurchaseOrderById(tenantId, id)
  if (!order) return null
  if (!order.representativePhone) {
    throw httpError(422, 'Supplier representative phone is not set')
  }

  const smsBody = buildPurchaseOrderSms(order)
  const result = await sendSms({ to: order.representativePhone, body: smsBody })

  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    recipient: order.representativePhone,
    ...result,
  }
}
