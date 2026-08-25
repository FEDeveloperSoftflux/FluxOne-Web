import { createStockRequest, listStockRequests } from '../stock_request.model.js'
import { success } from '../../../utils/response.util.js'

export async function stockRequestList(req, res) {
  return success(res, await listStockRequests(req.tenantId, req.validated.query))
}

export async function addStockRequest(req, res) {
  const row = await createStockRequest(req.tenantId, {
    ...req.validated.body,
    createdBy: req.user.id,
    branchId: req.validated.body.branchId || req.user.branchId,
  })
  return success(res, row, 201)
}
