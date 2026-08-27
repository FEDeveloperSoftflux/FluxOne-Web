import {
  inventoryReport as inventoryReportModel,
  lowStockReport as lowStockReportModel,
  purchaseReport as purchaseReportModel,
  stockMovementReport as stockMovementReportModel,
} from './report.model.js'
import { resolveInventoryScope } from '../shared.access.js'
import { fail, success } from '../../../utils/response.util.js'

function scopeError(res, err) {
  if (err?.status) return fail(res, err.message, err.status)
  throw err
}

export async function inventoryReport(req, res) {
  try {
    const { tenantId, branchId } = resolveInventoryScope(req)
    return success(res, await inventoryReportModel(tenantId, { ...req.validated.query, branchId }))
  } catch (err) {
    return scopeError(res, err)
  }
}

export async function stockMovementReport(req, res) {
  try {
    const { tenantId, branchId } = resolveInventoryScope(req)
    return success(res, await stockMovementReportModel(tenantId, { ...req.validated.query, branchId }))
  } catch (err) {
    return scopeError(res, err)
  }
}

export async function purchaseReport(req, res) {
  try {
    const { tenantId, branchId } = resolveInventoryScope(req)
    return success(res, await purchaseReportModel(tenantId, { ...req.validated.query, branchId }))
  } catch (err) {
    return scopeError(res, err)
  }
}

export async function lowStockReport(req, res) {
  try {
    const { tenantId, branchId } = resolveInventoryScope(req)
    return success(res, await lowStockReportModel(tenantId, { branchId }))
  } catch (err) {
    return scopeError(res, err)
  }
}
