import { getOverviewKpis, listStockAlerts, listStockOutGraph } from './dashboard.model.js'
import { resolveInventoryScope } from '../shared.access.js'
import { fail, success } from '../../../utils/response.util.js'
import { paginatedResult } from '../../../utils/pagination.util.js'

function scopeError(res, err) {
  if (err?.status) return fail(res, err.message, err.status)
  throw err
}

export async function overview(req, res) {
  try {
    const { tenantId, branchId } = resolveInventoryScope(req)
    const data = await getOverviewKpis(tenantId, { branchId })
    return success(res, data)
  } catch (err) {
    return scopeError(res, err)
  }
}

export async function alerts(req, res) {
  try {
    const { tenantId, branchId } = resolveInventoryScope(req)
    const result = await listStockAlerts(tenantId, { ...req.validated.query, branchId })
    return success(res, paginatedResult(result.items, result))
  } catch (err) {
    return scopeError(res, err)
  }
}

export async function stockGraph(req, res) {
  try {
    const { tenantId, branchId } = resolveInventoryScope(req)
    const data = await listStockOutGraph(tenantId, { ...req.validated.query, branchId })
    return success(res, data)
  } catch (err) {
    return scopeError(res, err)
  }
}
