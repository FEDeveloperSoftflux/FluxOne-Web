import { tenantQuery } from '../../../config/db.js'

export async function createOffer(tenantId, { name, percent }) {
  const { rows } = await tenantQuery(
    tenantId,
    `
      INSERT INTO offers (tenant_id, name, percent)
      VALUES ($1, $2, $3)
      RETURNING id, name, percent
    `,
    [name.trim(), parseFloat(percent)],
  )
  return rows[0]
}

export async function listOffers(tenantId) {
  const { rows } = await tenantQuery(
    tenantId,
    `
      SELECT id, name, percent
      FROM offers
      WHERE tenant_id = $1
      ORDER BY name ASC
    `,
  )
  return rows
}

export async function updateOffer(tenantId, id, { name, percent }) {
  const { rows } = await tenantQuery(
    tenantId,
    `
      UPDATE offers
      SET name = $1, percent = $2
      WHERE tenant_id = $3 AND id = $4
      RETURNING id, name, percent
    `,
    [name.trim(), parseFloat(percent), tenantId, id],
  )
  return rows[0]
}

export async function deleteOffer(tenantId, id) {
  // Check if assigned to any products
  const { rows } = await tenantQuery(
    tenantId,
    `SELECT id FROM products WHERE tenant_id = $1 AND offer_id = $2 LIMIT 1`,
    [id],
  )
  if (rows.length > 0) {
    throw new Error('This discount is currently assigned to one or more active products and cannot be deleted.')
  }

  const { rowCount } = await tenantQuery(
    tenantId,
    `DELETE FROM offers WHERE tenant_id = $1 AND id = $2`,
    [id],
  )
  return rowCount > 0
}
