import { tenantQuery } from '../../config/db.js'

function httpError(status, message) {
  const error = new Error(message)
  error.status = status
  return error
}

export async function listStockRequests(tenantId, { status } = {}) {
  const { rows } = await tenantQuery(
    tenantId,
    `
      SELECT
        sr.id,
        sr.kind,
        sr.status,
        sr.remaining_quantity AS "remainingQuantity",
        sr.created_at AS "createdAt",
        p.id AS "productId",
        p.name AS "productName",
        p.item_code AS "itemCode",
        sr.branch_id AS "branchId"
      FROM stock_requests sr
      JOIN products p ON p.id = sr.product_id AND p.tenant_id = sr.tenant_id
      WHERE sr.tenant_id = $1
        AND ($2::text IS NULL OR sr.status = $2)
      ORDER BY sr.created_at DESC
    `,
    [status || null],
  )
  return rows
}

export async function createStockRequest(tenantId, payload) {
  const { rows: products } = await tenantQuery(
    tenantId,
    `SELECT id, quantity FROM products WHERE tenant_id = $1 AND id = $2 LIMIT 1`,
    [payload.productId],
  )
  if (!products[0]) throw httpError(404, 'Product not found')

  const remaining = payload.remainingQuantity ?? products[0].quantity
  const { rows } = await tenantQuery(
    tenantId,
    `
      INSERT INTO stock_requests (
        tenant_id, branch_id, product_id, remaining_quantity, kind, status, created_by
      )
      VALUES ($1, $2, $3, $4, $5, 'open', $6)
      RETURNING id, kind, status, remaining_quantity AS "remainingQuantity"
    `,
    [
      payload.branchId || null,
      payload.productId,
      remaining,
      payload.kind,
      payload.createdBy || null,
    ],
  )
  return rows[0]
}
