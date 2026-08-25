import { tenantQuery } from '../../../config/db.js'

export async function upsertAttendance(tenantId, payload) {
  const { rows } = await tenantQuery(
    tenantId,
    `
      INSERT INTO attendance (tenant_id, staff_id, work_date, status, note, created_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (tenant_id, staff_id, work_date)
      DO UPDATE SET status = EXCLUDED.status, note = EXCLUDED.note
      RETURNING id, work_date AS "workDate", status
    `,
    [payload.staffId, payload.workDate, payload.status, payload.note || null, payload.createdBy],
  )
  return rows[0]
}

export async function listAttendance(tenantId) {
  const { rows } = await tenantQuery(
    tenantId,
    `
      SELECT a.id, a.work_date AS "workDate", a.status, a.note, s.id AS "staffId"
      FROM attendance a
      JOIN staff s ON s.id = a.staff_id AND s.tenant_id = a.tenant_id
      WHERE a.tenant_id = $1
      ORDER BY a.work_date DESC
    `,
  )
  return rows
}
