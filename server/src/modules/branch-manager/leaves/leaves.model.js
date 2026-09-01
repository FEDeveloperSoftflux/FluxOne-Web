import { tenantQuery } from '../../../config/db.js'

export async function createLeave(tenantId, { staffId, startDate, endDate, reason, status }) {
  const { rows } = await tenantQuery(
    tenantId,
    `
      INSERT INTO leaves (tenant_id, staff_id, start_date, end_date, reason, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, staff_id AS "staffId", start_date AS "startDate", end_date AS "endDate", reason, status
    `,
    [staffId, startDate, endDate, reason || null, status || 'approved'],
  )
  return rows[0]
}

export async function listLeaves(tenantId) {
  const { rows } = await tenantQuery(
    tenantId,
    `
      SELECT
  l.id,
  l.start_date AS "startDate",
  l.end_date AS "endDate",
  l.reason,
  l.status,
  s.id AS "staffId",
  u.full_name AS "fullName"
FROM leaves l
JOIN staff s ON s.id = l.staff_id AND s.tenant_id = l.tenant_id
JOIN users u ON u.id = s.user_id AND u.tenant_id = s.tenant_id
WHERE l.tenant_id = $1
ORDER BY l.created_at DESC
    `,
  )
  return rows
}
