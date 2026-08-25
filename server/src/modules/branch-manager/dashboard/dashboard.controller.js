import {
  buildBranchReport,
  getBranchOverview,
  getDailySalesSummary,
  getInventoryStatusChart,
  getSalesGraphData,
  listStaffPerformanceSnapshot,
  renderBranchReportHtml,
} from './dashboard.model.js'
import { success } from '../../../utils/response.util.js'
import { paginatedResult } from '../../../utils/pagination.util.js'

function withBranchScope(req) {
  const query = { ...req.validated.query }
  if (!query.branchId && req.user.branchId) {
    query.branchId = req.user.branchId
  }
  return query
}

export async function overview(req, res) {
  const data = await getBranchOverview(req.tenantId, withBranchScope(req))
  return success(res, data)
}

export async function salesSummary(req, res) {
  const data = await getDailySalesSummary(req.tenantId, withBranchScope(req))
  return success(res, data)
}

export async function salesGraph(req, res) {
  const data = await getSalesGraphData(req.tenantId, withBranchScope(req))
  return success(res, data)
}

export async function staffPerformance(req, res) {
  const result = await listStaffPerformanceSnapshot(req.tenantId, withBranchScope(req))
  return success(res, paginatedResult(result.items, result))
}

export async function inventoryStatus(req, res) {
  const result = await getInventoryStatusChart(req.tenantId, withBranchScope(req))
  return success(res, {
    ...paginatedResult(result.items, result),
    chart: result.chart,
  })
}

export async function downloadReport(req, res) {
  const report = await buildBranchReport(req.tenantId, withBranchScope(req))
  const html = renderBranchReportHtml(report)
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Content-Disposition', 'inline; filename="branch-report.html"')
  return res.status(200).send(html)
}
