  import { tenantClientQuery, tenantQuery, withTransaction } from '../../../config/db.js'
  import { MOVEMENT_TYPES } from '../../../config/constants.js'

  function onHandDelta(movementType, quantity) {
    const amount = Number(quantity)
    if (movementType === MOVEMENT_TYPES.IN) return amount
    if (movementType === MOVEMENT_TYPES.ADJUSTMENT) return amount
    if (movementType === MOVEMENT_TYPES.TRANSFER) return 0
    return -Math.abs(amount)
  }

  async function applyPurchaseSnapshot(client, tenantId, { productId, supplierId, unitCost }) {
    if (unitCost == null && !supplierId) return
    await tenantClientQuery(
      client,
      tenantId,
      `
        UPDATE products
        SET
          last_purchase_price = CASE
            WHEN $3::numeric IS NOT NULL AND purchase_price IS DISTINCT FROM $3::numeric THEN purchase_price
            ELSE last_purchase_price
          END,
          last_purchase_supplier_id = CASE
            WHEN $3::numeric IS NOT NULL AND purchase_price IS DISTINCT FROM $3::numeric
              THEN current_purchase_supplier_id
            ELSE last_purchase_supplier_id
          END,
          purchase_price = COALESCE($3::numeric, purchase_price),
          current_purchase_supplier_id = COALESCE($4::uuid, current_purchase_supplier_id)
        WHERE tenant_id = $1 AND id = $2
      `,
      [productId, unitCost ?? null, supplierId || null],
    )
  }

  function httpError(status, message) {
    const error = new Error(message)
    error.status = status
    return error
  }

  const OUTBOUND_TYPES = new Set([MOVEMENT_TYPES.OUT, MOVEMENT_TYPES.DAMAGED, MOVEMENT_TYPES.EXPIRED])

  async function assertSufficientStock(client, tenantId, productId, quantity) {
    const { rows } = await tenantClientQuery(
      client,
      tenantId,
      `SELECT quantity, status FROM products WHERE tenant_id = $1 AND id = $2 FOR UPDATE`,
      [productId],
    )
    if (!rows[0]) throw httpError(404, 'Product not found')
    if (rows[0].status === 'inactive') {
      throw httpError(409, 'Product is inactive and cannot be used for stock movements')
    }
    if (Number(rows[0].quantity) < Number(quantity)) {
      throw httpError(422, 'Insufficient stock on hand')
    }
  }

  async function assertProductActive(client, tenantId, productId) {
    const { rows } = await tenantClientQuery(
      client,
      tenantId,
      `SELECT id, status FROM products WHERE tenant_id = $1 AND id = $2 LIMIT 1`,
      [productId],
    )
    if (!rows[0]) throw httpError(404, 'Product not found')
    if (rows[0].status === 'inactive') {
      throw httpError(409, 'Product is inactive and cannot be used for stock movements')
    }
    return rows[0]
  }

  async function applyOnHand(client, tenantId, productId, delta) {
    if (!delta) return
    await tenantClientQuery(
      client,
      tenantId,
      `UPDATE products SET quantity = quantity + $3 WHERE tenant_id = $1 AND id = $2`,
      [productId, delta],
    )
  }

  async function assertBranchExists(client, tenantId, branchId) {
    const { rows } = await tenantClientQuery(
      client,
      tenantId,
      `SELECT id FROM branches WHERE tenant_id = $1 AND id = $2 LIMIT 1`,
      [branchId],
    )
    if (!rows[0]) throw httpError(404, 'Branch not found')
  }

  async function adjustBranchInventory(client, tenantId, branchId, productId, delta) {
    const amount = Number(delta)
    if (!amount) return

    const { rows } = await tenantClientQuery(
      client,
      tenantId,
      `
        SELECT quantity
        FROM branch_inventory
        WHERE tenant_id = $1 AND branch_id = $2 AND product_id = $3
        FOR UPDATE
      `,
      [branchId, productId],
    )

    const current = rows[0] ? Number(rows[0].quantity) : 0
    const next = current + amount
    if (next < 0) throw httpError(422, 'Insufficient branch stock')

    if (rows[0]) {
      await tenantClientQuery(
        client,
        tenantId,
        `
          UPDATE branch_inventory
          SET quantity = $4, updated_at = now()
          WHERE tenant_id = $1 AND branch_id = $2 AND product_id = $3
        `,
        [branchId, productId, next],
      )
      return
    }

    if (amount < 0) throw httpError(422, 'Insufficient branch stock')

    await tenantClientQuery(
      client,
      tenantId,
      `
        INSERT INTO branch_inventory (tenant_id, branch_id, product_id, quantity)
        VALUES ($1, $2, $3, $4)
      `,
      [branchId, productId, amount],
    )
  }

  export async function listTransfers(tenantId, filters = {}) {
    const page = Math.max(1, Number(filters.page) || 1)
    const limit = Math.min(50, Math.max(1, Number(filters.limit) || 8))
    const offset = (page - 1) * limit

    const filterParams = [
      filters.q || null,
      filters.categoryId || null,
      filters.subcategoryId || null,
      filters.scale || null,
      filters.type || null,
    ]

    const { rows: countRows } = await tenantQuery(
      tenantId,
      `
        SELECT count(*)::int AS total
        FROM inventory_ledger l
        JOIN products p ON p.id = l.product_id AND p.tenant_id = l.tenant_id
        WHERE l.tenant_id = $1
          AND l.movement_type = 'transfer'
          AND ($2::text IS NULL OR p.name ILIKE '%' || $2 || '%' OR p.item_code ILIKE '%' || $2 || '%')
          AND ($3::uuid IS NULL OR p.category_id = $3)
          AND ($4::uuid IS NULL OR p.subcategory_id = $4)
          AND ($5::text IS NULL OR p.scale = $5)
          AND ($6::text IS NULL OR p.type = $6)
      `,
      filterParams,
    )

    const { rows } = await tenantQuery(
      tenantId,
      `
        SELECT
          l.id,
          l.quantity,
          l.scale,
          l.reason,
          l.created_at AS "createdAt",
          p.name AS "productName",
          p.item_code AS "itemCode",
          fb.id AS "fromBranchId",
          fb.name AS "fromBranchName",
          tb.id AS "toBranchId",
          tb.name AS "toBranchName"
        FROM inventory_ledger l
        JOIN products p ON p.id = l.product_id AND p.tenant_id = l.tenant_id
        JOIN branches fb ON fb.id = l.from_branch_id AND fb.tenant_id = l.tenant_id
        JOIN branches tb ON tb.id = l.to_branch_id AND tb.tenant_id = l.tenant_id
        WHERE l.tenant_id = $1
          AND l.movement_type = 'transfer'
          AND ($2::text IS NULL OR p.name ILIKE '%' || $2 || '%' OR p.item_code ILIKE '%' || $2 || '%')
          AND ($3::uuid IS NULL OR p.category_id = $3)
          AND ($4::uuid IS NULL OR p.subcategory_id = $4)
          AND ($5::text IS NULL OR p.scale = $5)
          AND ($6::text IS NULL OR p.type = $6)
        ORDER BY l.created_at DESC
        LIMIT $7 OFFSET $8
      `,
      [...filterParams, limit, offset],
    )
    return { items: rows, total: countRows[0]?.total || 0, page, limit }
  }

  export async function createStockTransfer(tenantId, event) {
    if (event.fromBranchId === event.toBranchId) {
      throw httpError(422, 'Source and destination branches must differ')
    }

    return withTransaction(async (client) => {
      await assertBranchExists(client, tenantId, event.fromBranchId)
      await assertBranchExists(client, tenantId, event.toBranchId)

      const { rows: products } = await tenantClientQuery(
        client,
        tenantId,
        `SELECT id, status FROM products WHERE tenant_id = $1 AND id = $2 LIMIT 1`,
        [event.productId],
      )
      if (!products[0]) throw httpError(404, 'Product not found')
      if (products[0].status === 'inactive') {
        throw httpError(409, 'Product is inactive and cannot be transferred')
      }

      await adjustBranchInventory(
        client,
        tenantId,
        event.fromBranchId,
        event.productId,
        -Math.abs(Number(event.quantity)),
      )
      await adjustBranchInventory(
        client,
        tenantId,
        event.toBranchId,
        event.productId,
        Math.abs(Number(event.quantity)),
      )

      return insertLedgerEventInTx(client, tenantId, {
        ...event,
        movementType: MOVEMENT_TYPES.TRANSFER,
      })
    })
  }

  export async function listLedger(tenantId, filters = {}) {
    const page = Math.max(1, Number(filters.page) || 1)
    const limit = Math.min(50, Math.max(1, Number(filters.limit) || 8))
    const offset = (page - 1) * limit

    const filterParams = [
      filters.movementType || null,
      filters.q || null,
      filters.categoryId || null,
      filters.subcategoryId || null,
      filters.scale || null,
      filters.type || null,
    ]

    const { rows: countRows } = await tenantQuery(
      tenantId,
      `
        SELECT count(*)::int AS total
        FROM inventory_ledger l
        JOIN products p ON p.id = l.product_id AND p.tenant_id = l.tenant_id
        WHERE l.tenant_id = $1
          AND ($2::text IS NULL OR l.movement_type = $2)
          AND ($3::text IS NULL OR p.name ILIKE '%' || $3 || '%' OR p.item_code ILIKE '%' || $3 || '%')
          AND ($4::uuid IS NULL OR p.category_id = $4)
          AND ($5::uuid IS NULL OR p.subcategory_id = $5)
          AND ($6::text IS NULL OR p.scale = $6)
          AND ($7::text IS NULL OR p.type = $7)
      `,
      filterParams,
    )

    const { rows } = await tenantQuery(
      tenantId,
      `
        SELECT
          l.id,
          l.product_id AS "productId",
          l.movement_type AS "movementType",
          l.quantity,
          l.scale,
          l.reason,
          l.created_at AS "createdAt",
          l.expires_at AS "expiresAt",
          l.supplier_id AS "supplierId",
          l.purchase_order_id AS "purchaseOrderId",
          l.damaged_by_user_id AS "damagedByUserId",
          l.damaged_location AS "damagedLocation",
          l.unit_cost AS "unitCost",
          p.name AS "productName",
          p.image_url AS "imageUrl",
          p.type,
          p.item_code AS "itemCode",
          s.company_name AS "companyName",
          du.full_name AS "damagedByName"
        FROM inventory_ledger l
        JOIN products p ON p.id = l.product_id AND p.tenant_id = l.tenant_id
        LEFT JOIN suppliers s ON s.id = l.supplier_id AND s.tenant_id = l.tenant_id
        LEFT JOIN users du ON du.id = l.damaged_by_user_id AND du.tenant_id = l.tenant_id
        WHERE l.tenant_id = $1
          AND ($2::text IS NULL OR l.movement_type = $2)
          AND ($3::text IS NULL OR p.name ILIKE '%' || $3 || '%' OR p.item_code ILIKE '%' || $3 || '%')
          AND ($4::uuid IS NULL OR p.category_id = $4)
          AND ($5::uuid IS NULL OR p.subcategory_id = $5)
          AND ($6::text IS NULL OR p.scale = $6)
          AND ($7::text IS NULL OR p.type = $7)
        ORDER BY l.created_at DESC
        LIMIT $8 OFFSET $9
      `,
      [...filterParams, limit, offset],
    )
    return { items: rows, total: countRows[0]?.total || 0, page, limit }
  }

  export async function getLedgerById(tenantId, id, client = null) {
    const run = client
      ? (text, params) => tenantClientQuery(client, tenantId, text, params)
      : (text, params) => tenantQuery(tenantId, text, params)
    const { rows } = await run(
      `
        SELECT id, product_id AS "productId", movement_type AS "movementType", quantity
        FROM inventory_ledger
        WHERE tenant_id = $1 AND id = $2
        LIMIT 1
      `,
      [id],
    )
    return rows[0] || null
  }

  export async function insertLedgerEventInTx(client, tenantId, event) {
    await assertProductActive(client, tenantId, event.productId)

    const outboundQty = Math.abs(Number(event.quantity))
    if (OUTBOUND_TYPES.has(event.movementType)) {
      await assertSufficientStock(client, tenantId, event.productId, outboundQty)
    }

    const { rows } = await tenantClientQuery(
      client,
      tenantId,
      `
        INSERT INTO inventory_ledger (
          tenant_id, product_id, movement_type, quantity, scale, reason,
          damaged_by_user_id, damaged_location, supplier_id, purchase_order_id,
          expires_at, unit_cost, created_by, pos_event_id, from_branch_id, to_branch_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING id, movement_type AS "movementType", quantity
      `,
      [
        event.productId,
        event.movementType,
        event.quantity,
        event.scale,
        event.reason || null,
        event.damagedByUserId || null,
        event.damagedLocation || null,
        event.supplierId || null,
        event.purchaseOrderId || null,
        event.expiresAt || null,
        event.unitCost ?? null,
        event.createdBy || null,
        event.posEventId || null,
        event.fromBranchId || null,
        event.toBranchId || null,
      ],
    )

    await applyOnHand(client, tenantId, event.productId, onHandDelta(event.movementType, event.quantity))

    if (event.movementType === MOVEMENT_TYPES.IN && event.branchId) {
      await adjustBranchInventory(client, tenantId, event.branchId, event.productId, Math.abs(Number(event.quantity)))
    }

    if (event.movementType === MOVEMENT_TYPES.IN) {
      await applyPurchaseSnapshot(client, tenantId, {
        productId: event.productId,
        supplierId: event.supplierId,
        unitCost: event.unitCost,
      })
    }

    return rows[0]
  }

  export async function insertLedgerEvent(tenantId, event) {
    return withTransaction((client) => insertLedgerEventInTx(client, tenantId, event))
  }

  export async function insertLedgerLines(tenantId, events) {
    return withTransaction(async (client) => {
      const saved = []
      for (const event of events) {
        saved.push(await insertLedgerEventInTx(client, tenantId, event))
      }
      return saved
    })
  }

  export async function updateLedgerEvent(tenantId, id, payload) {
    return withTransaction(async (client) => {
      const existing = await getLedgerById(tenantId, id, client)
      if (!existing) return null

      const setClauses = []
      const params = [id]

      if ('quantity' in payload) {
        setClauses.push(`quantity = $${params.length + 2}`)
        params.push(payload.quantity ?? null)
      }

      if ('reason' in payload) {
        setClauses.push(`reason = $${params.length + 2}`)
        params.push(payload.reason ?? null)
      }

      if ('damagedByUserId' in payload) {
        setClauses.push(`damaged_by_user_id = $${params.length + 2}`)
        params.push(payload.damagedByUserId ?? null)
      }

      if ('damagedLocation' in payload) {
        setClauses.push(`damaged_location = $${params.length + 2}`)
        params.push(payload.damagedLocation ?? null)
      }

      if ('expiresAt' in payload) {
        setClauses.push(`expires_at = $${params.length + 2}`)
        params.push(payload.expiresAt ?? null)
      }

      if ('supplierId' in payload) {
        setClauses.push(`supplier_id = $${params.length + 2}`)
        params.push(payload.supplierId ?? null)
      }

      if (!setClauses.length) {
        const { rows } = await tenantClientQuery(
          client,
          tenantId,
          `
            SELECT
              id, quantity, reason, product_id AS "productId", movement_type AS "movementType",
              damaged_by_user_id AS "damagedByUserId", damaged_location AS "damagedLocation",
              expires_at AS "expiresAt", supplier_id AS "supplierId"
            FROM inventory_ledger
            WHERE tenant_id = $1 AND id = $2
            LIMIT 1
          `,
          [id],
        )
        return rows[0] || null
      }

      const { rows } = await tenantClientQuery(
        client,
        tenantId,
        `
          UPDATE inventory_ledger
          SET ${setClauses.join(', ')}
          WHERE tenant_id = $1 AND id = $2
          RETURNING
            id, quantity, reason, product_id AS "productId", movement_type AS "movementType",
            damaged_by_user_id AS "damagedByUserId", damaged_location AS "damagedLocation",
            expires_at AS "expiresAt", supplier_id AS "supplierId"
        `,
        params,
      )
      const updated = rows[0]
      const delta = onHandDelta(updated.movementType, updated.quantity) - onHandDelta(existing.movementType, existing.quantity)
      await applyOnHand(client, tenantId, existing.productId, delta)
      return updated
    })
  }

  export async function deleteLedgerEvent(tenantId, id) {
    return withTransaction(async (client) => {
      const existing = await getLedgerById(tenantId, id, client)
      if (!existing) return false

      const { rowCount } = await tenantClientQuery(
        client,
        tenantId,
        `DELETE FROM inventory_ledger WHERE tenant_id = $1 AND id = $2`,
        [id],
      )
      if (rowCount > 0) {
        await applyOnHand(client, tenantId, existing.productId, -onHandDelta(existing.movementType, existing.quantity))
      }
      return rowCount > 0
    })
  }
