import { getOverviewKpis, listStockAlerts, listStockOutGraph } from './dashboard.model.js'
import { success } from '../../../utils/response.util.js'
import { paginatedResult } from '../../../utils/pagination.util.js'

export async function overview(req, res) {
  const data = await getOverviewKpis(req.tenantId)
  return success(res, data)
}

export async function alerts(req, res) {
  const result = await listStockAlerts(req.tenantId, req.validated.query)
  return success(res, paginatedResult(result.items, result))
}

export async function stockGraph(req, res) {
  const data = await listStockOutGraph(req.tenantId, req.validated.query)
  return success(res, data)
}
