import {
  inventoryReport as inventoryReportModel,
  lowStockReport as lowStockReportModel,
  purchaseReport as purchaseReportModel,
  stockMovementReport as stockMovementReportModel,
} from './report.model.js'
import { success } from '../../../utils/response.util.js'

export async function inventoryReport(req, res) {
  return success(res, await inventoryReportModel(req.tenantId, req.validated.query))
}

export async function stockMovementReport(req, res) {
  return success(res, await stockMovementReportModel(req.tenantId, req.validated.query))
}

export async function purchaseReport(req, res) {
  return success(res, await purchaseReportModel(req.tenantId, req.validated.query))
}

export async function lowStockReport(req, res) {
  return success(res, await lowStockReportModel(req.tenantId))
}
