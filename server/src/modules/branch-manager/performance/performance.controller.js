import { tenantQuery } from '../../../config/db.js'
import { success } from '../../../utils/response.util.js'

export async function listScales(req, res) {
  const { rows } = await tenantQuery(
    req.tenantId,
    `SELECT id, code, name, max_points AS "maxPoints" FROM scoring_scales WHERE tenant_id = $1`,
  )
  return success(res, rows)
}

export async function scoreStaff(req, res) {
  const { staffId, scaleId, points } = req.validated.body
  const { rows } = await tenantQuery(
    req.tenantId,
    `
      INSERT INTO performance_scores (tenant_id, staff_id, scale_id, points, created_by)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, points
    `,
    [staffId, scaleId, points, req.user.id],
  )
  return success(res, rows[0], 201)
}
