import { tenantClientQuery, tenantQuery, withTransaction } from '../../../config/db.js'
import { MOVEMENT_TYPES } from '../../../config/constants.js'

// products.quantity = company-wide on-hand.
// branch_inventory = per-branch allocation (subset of total).
// Stock-in with branchId bumps both; transfers only move between branches.
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
  return rows[0]
}

async function lockProduct(client, tenantId, productId) {
  const { rows } = await tenantClientQuery(
    client,
    tenantId,
    `SELECT quantity, status FROM products WHERE tenant_id = $1 AND id = $2 FOR UPDATE`,
    [productId],
  )
  if (!rows[0]) throw httpError(404, 'Product not found')
  return rows[0]
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
  const { rowCount } = await tenantClientQuery(
    client,
    tenantId,
    `
      UPDATE products
      SET quantity = quantity + $3
      WHERE tenant_id = $1 AND id = $2 AND quantity + $3 >= 0
    `,
    [productId, delta],
  )
  if (!rowCount) {
    throw httpError(422, 'Insufficient stock on hand')
  }
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

async function adjustBranchInventory(client, tenantId, branchId, productId, delta, { optional = false } = {}) {
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

  if (!rows[0]) {
    // POS may run before branch stock is seeded — skip outbound when not tracked
    if (amount < 0) {
      if (optional) return
      throw httpError(422, 'Insufficient branch stock')
    }
    await tenantClientQuery(
      client,
      tenantId,
      `
        INSERT INTO branch_inventory (tenant_id, branch_id, product_id, quantity)
        VALUES ($1, $2, $3, $4)
      `,
      [branchId, productId, amount],
    )
    return
  }

  const current = Number(rows[0].quantity)
  const next = current + amount
  if (next < 0) throw httpError(422, 'Insufficient branch stock')

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
}

function validateQuantityForType(movementType, quantity) {
  const amount = Number(quantity)
  if (Number.isNaN(amount)) throw httpError(422, 'Invalid quantity')
  if (movementType === MOVEMENT_TYPES.ADJUSTMENT) {
    if (amount === 0) throw httpError(422, 'Adjustment quantity cannot be zero')
    return
  }
  if (OUTBOUND_TYPES.has(movementType) || movementType === MOVEMENT_TYPES.IN) {
    if (!(amount > 0)) throw httpError(422, 'Quantity must be positive')
  }
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
    filters.branchId || null,
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
        AND ($7::uuid IS NULL OR p.branch_id = $7)
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
        AND ($7::uuid IS NULL OR p.branch_id = $7)
      ORDER BY l.created_at DESC
      LIMIT $8 OFFSET $9
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

    // Branch scope: product must belong to scoped branch when set
    const { rows: products } = await tenantClientQuery(
      client,
      tenantId,
      `
        SELECT id, status, branch_id AS "branchId"
        FROM products
        WHERE tenant_id = $1 AND id = $2
          AND ($3::uuid IS NULL OR branch_id = $3)
        LIMIT 1
      `,
      [event.productId, event.scopeBranchId || null],
    )
    if (!products[0]) throw httpError(404, 'Product not found')
    if (products[0].status === 'inactive') {
      throw httpError(409, 'Product is inactive and cannot be transferred')
    }
    if (event.scopeBranchId && event.fromBranchId !== event.scopeBranchId) {
      throw httpError(403, 'Transfers must originate from your assigned branch')
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

  const movementTypes = Array.isArray(filters.movementTypes)
    ? filters.movementTypes
    : filters.movementType
      ? [filters.movementType]
      : null

  const filterParams = [
    movementTypes,
    filters.q || null,
    filters.categoryId || null,
    filters.subcategoryId || null,
    filters.scale || null,
    filters.type || null,
    filters.branchId || null,
  ]

  const { rows: countRows } = await tenantQuery(
    tenantId,
    `
      SELECT count(*)::int AS total
      FROM inventory_ledger l
      JOIN products p ON p.id = l.product_id AND p.tenant_id = l.tenant_id
      WHERE l.tenant_id = $1
        AND ($2::text[] IS NULL OR l.movement_type = ANY($2::text[]))
        AND ($3::text IS NULL OR p.name ILIKE '%' || $3 || '%' OR p.item_code ILIKE '%' || $3 || '%')
        AND ($4::uuid IS NULL OR p.category_id = $4)
        AND ($5::uuid IS NULL OR p.subcategory_id = $5)
        AND ($6::text IS NULL OR p.scale = $6)
        AND ($7::text IS NULL OR p.type = $7)
        AND ($8::uuid IS NULL OR p.branch_id = $8)
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
        l.to_branch_id AS "toBranchId",
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
        AND ($2::text[] IS NULL OR l.movement_type = ANY($2::text[]))
        AND ($3::text IS NULL OR p.name ILIKE '%' || $3 || '%' OR p.item_code ILIKE '%' || $3 || '%')
        AND ($4::uuid IS NULL OR p.category_id = $4)
        AND ($5::uuid IS NULL OR p.subcategory_id = $5)
        AND ($6::text IS NULL OR p.scale = $6)
        AND ($7::text IS NULL OR p.type = $7)
        AND ($8::uuid IS NULL OR p.branch_id = $8)
      ORDER BY l.created_at DESC
      LIMIT $9 OFFSET $10
    `,
    [...filterParams, limit, offset],
  )
  return { items: rows, total: countRows[0]?.total || 0, page, limit }
}

export async function getLedgerById(tenantId, id, client = null, { branchId = null } = {}) {
  const run = client
    ? (text, params) => tenantClientQuery(client, tenantId, text, params)
    : (text, params) => tenantQuery(tenantId, text, params)
  const { rows } = await run(
    `
      SELECT
        l.id,
        l.product_id AS "productId",
        l.movement_type AS "movementType",
        l.quantity,
        l.to_branch_id AS "toBranchId"
      FROM inventory_ledger l
      JOIN products p ON p.id = l.product_id AND p.tenant_id = l.tenant_id
      WHERE l.tenant_id = $1 AND l.id = $2
        AND ($3::uuid IS NULL OR p.branch_id = $3)
      LIMIT 1
      FOR UPDATE OF l
    `,
    [id, branchId || null],
  )
  return rows[0] || null
}

export async function insertLedgerEventInTx(client, tenantId, event) {
  // Branch scope: when scoped, product must belong to that branch
  if (event.scopeBranchId != null) {
    const { rows: scoped } = await tenantClientQuery(
      client,
      tenantId,
      `
        SELECT id, branch_id
        FROM products
        WHERE tenant_id = $1 AND id = $2
          AND ($3::uuid IS NULL OR branch_id = $3)
        LIMIT 1
      `,
      [event.productId, event.scopeBranchId],
    )
    if (!scoped[0]) throw httpError(404, 'Product not found')

    if (event.supplierId) {
      const { rows: suppliers } = await tenantClientQuery(
        client,
        tenantId,
        `
          SELECT id FROM suppliers
          WHERE tenant_id = $1 AND id = $2 AND branch_id = $3
          LIMIT 1
        `,
        [event.supplierId, event.scopeBranchId],
      )
      if (!suppliers[0]) throw httpError(404, 'Supplier not found')
    }
  }

  await assertProductActive(client, tenantId, event.productId)
  validateQuantityForType(event.movementType, event.quantity)

  const qty = Number(event.quantity)
  const outboundQty = Math.abs(qty)

  if (OUTBOUND_TYPES.has(event.movementType)) {
    await assertSufficientStock(client, tenantId, event.productId, outboundQty)
  } else if (event.movementType === MOVEMENT_TYPES.ADJUSTMENT && qty < 0) {
    await assertSufficientStock(client, tenantId, event.productId, outboundQty)
  } else if (event.movementType !== MOVEMENT_TYPES.TRANSFER) {
    await lockProduct(client, tenantId, event.productId)
  }

  const destinationBranchId = event.toBranchId || event.branchId || null
  if (event.movementType === MOVEMENT_TYPES.IN && destinationBranchId) {
    await assertBranchExists(client, tenantId, destinationBranchId)
  }

  // POS sale/refund at a branch: keep branch allocation in sync with company on-hand
  if (event.branchId && OUTBOUND_TYPES.has(event.movementType)) {
    await adjustBranchInventory(client, tenantId, event.branchId, event.productId, -outboundQty, {
      optional: Boolean(event.posEventId),
    })
  }
  if (event.branchId && event.movementType === MOVEMENT_TYPES.IN && event.posEventId) {
    await adjustBranchInventory(client, tenantId, event.branchId, event.productId, outboundQty)
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
      destinationBranchId && event.movementType === MOVEMENT_TYPES.IN && !event.posEventId
        ? destinationBranchId
        : event.toBranchId || null,
    ],
  )

  await applyOnHand(client, tenantId, event.productId, onHandDelta(event.movementType, event.quantity))

  // Stock-in received at a branch: allocate to branch_inventory (company total already bumped)
  if (event.movementType === MOVEMENT_TYPES.IN && destinationBranchId && !event.posEventId) {
    await adjustBranchInventory(client, tenantId, destinationBranchId, event.productId, Math.abs(qty))
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

export async function updateLedgerEvent(
  tenantId,
  id,
  payload,
  expectedMovementType = null,
  { branchId = null } = {},
) {
  return withTransaction(async (client) => {
    const existing = await getLedgerById(tenantId, id, client, { branchId })
    if (!existing) return null
    if (expectedMovementType && existing.movementType !== expectedMovementType) {
      return null
    }

    if ('quantity' in payload && payload.quantity != null) {
      validateQuantityForType(existing.movementType, payload.quantity)
    }

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
            expires_at AS "expiresAt", supplier_id AS "supplierId", to_branch_id AS "toBranchId"
          FROM inventory_ledger
          WHERE tenant_id = $1 AND id = $2
          LIMIT 1
        `,
        [id],
      )
      return rows[0] || null
    }

    const nextQuantity = 'quantity' in payload ? payload.quantity : existing.quantity
    const delta =
      onHandDelta(existing.movementType, nextQuantity) -
      onHandDelta(existing.movementType, existing.quantity)

    await lockProduct(client, tenantId, existing.productId)
    if (delta < 0) {
      await assertSufficientStock(client, tenantId, existing.productId, Math.abs(delta))
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
          expires_at AS "expiresAt", supplier_id AS "supplierId", to_branch_id AS "toBranchId"
      `,
      params,
    )
    const updated = rows[0]
    await applyOnHand(client, tenantId, existing.productId, delta)

    // Reverse/apply branch allocation when stock-in was received at a branch
    if (existing.toBranchId && 'quantity' in payload) {
      const branchDelta = Math.abs(Number(nextQuantity)) - Math.abs(Number(existing.quantity))
      if (branchDelta) {
        await adjustBranchInventory(
          client,
          tenantId,
          existing.toBranchId,
          existing.productId,
          branchDelta,
        )
      }
    }

    return updated
  })
}

export async function deleteLedgerEvent(
  tenantId,
  id,
  expectedMovementType = null,
  { branchId = null } = {},
) {
  return withTransaction(async (client) => {
    const existing = await getLedgerById(tenantId, id, client, { branchId })
    if (!existing) return false
    if (expectedMovementType && existing.movementType !== expectedMovementType) {
      return false
    }

    const reverseDelta = -onHandDelta(existing.movementType, existing.quantity)
    await lockProduct(client, tenantId, existing.productId)
    if (reverseDelta < 0) {
      await assertSufficientStock(client, tenantId, existing.productId, Math.abs(reverseDelta))
    }

    const { rowCount } = await tenantClientQuery(
      client,
      tenantId,
      `DELETE FROM inventory_ledger WHERE tenant_id = $1 AND id = $2`,
      [id],
    )
    if (rowCount > 0) {
      await applyOnHand(client, tenantId, existing.productId, reverseDelta)
      if (existing.toBranchId && existing.movementType === MOVEMENT_TYPES.IN) {
        await adjustBranchInventory(
          client,
          tenantId,
          existing.toBranchId,
          existing.productId,
          -Math.abs(Number(existing.quantity)),
        )
      }
    }
    return rowCount > 0
  })
}

// Convert past-due stock-in lots into expired movements (dynamic expiry).
// Caps qty by current on-hand so prior sales don't fail the batch.
export async function processDueExpirations(tenantId, createdBy = null, { branchId = null } = {}) {
  return withTransaction(async (client) => {
    const { rows: due } = await tenantClientQuery(
      client,
      tenantId,
      `
        SELECT
          l.id,
          l.product_id AS "productId",
          l.quantity,
          l.scale,
          l.supplier_id AS "supplierId",
          l.expires_at AS "expiresAt"
        FROM inventory_ledger l
        JOIN products p ON p.id = l.product_id AND p.tenant_id = l.tenant_id
        WHERE l.tenant_id = $1
          AND l.movement_type = 'in'
          AND l.expires_at IS NOT NULL
          AND l.expires_at::date <= CURRENT_DATE
          AND l.expiry_processed = FALSE
          AND ($2::uuid IS NULL OR p.branch_id = $2)
        ORDER BY l.expires_at ASC, l.created_at ASC
        FOR UPDATE OF l
      `,
      [branchId || null],
    )

    let processed = 0
    for (const row of due) {
      const product = await lockProduct(client, tenantId, row.productId)
      const onHand = Number(product.quantity)
      const lotQty = Math.abs(Number(row.quantity))
      const expireQty = Math.min(lotQty, Math.max(0, onHand))

      if (expireQty > 0) {
        await insertLedgerEventInTx(client, tenantId, {
          productId: row.productId,
          movementType: MOVEMENT_TYPES.EXPIRED,
          quantity: expireQty,
          scale: row.scale || 'unit',
          supplierId: row.supplierId || null,
          expiresAt: row.expiresAt,
          reason: 'Auto-expired from stock-in lot',
          createdBy,
        })
        processed += 1
      }

      await tenantClientQuery(
        client,
        tenantId,
        `
          UPDATE inventory_ledger
          SET expiry_processed = TRUE
          WHERE tenant_id = $1 AND id = $2
        `,
        [row.id],
      )
    }

    return { processed, scanned: due.length }
  })
}

