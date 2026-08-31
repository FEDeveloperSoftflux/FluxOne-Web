import { tenantQuery } from '../../../config/db.js'

export async function createHoliday(tenantId, { name, date }) {
  const { rows } = await tenantQuery(
    tenantId,
    `
      INSERT INTO holidays (tenant_id, holiday_date, name)
      VALUES ($1, $2, $3)
      ON CONFLICT (tenant_id, holiday_date) DO UPDATE SET name = EXCLUDED.name
      RETURNING id, holiday_date AS "holidayDate", name
    `,
    [date, name.trim()],
  )
  return rows[0]
}

export async function listHolidays(tenantId) {
  const { rows } = await tenantQuery(
    tenantId,
    `
      SELECT id, holiday_date AS "holidayDate", name
      FROM holidays
      WHERE tenant_id = $1
      ORDER BY holiday_date DESC
    `,
  )
  return rows
}
