import {
  createStockTransfer,
  deleteLedgerEvent,
  insertLedgerEvent,
  insertLedgerLines,
  listLedger,
  listTransfers,
  updateLedgerEvent,
} from './control.model.js'
import { receivePurchaseOrder } from '../purchase-orders/purchase_order.model.js'
import { MOVEMENT_TYPES } from '../../../config/constants.js'
import { fail, success } from '../../../utils/response.util.js'
import { paginatedResult } from '../../../utils/pagination.util.js'

function listByType(movementType) {
  return async (req, res) => {
    const result = await listLedger(req.tenantId, { ...req.validated.query, movementType })
    return success(res, paginatedResult(result.items, result))
  }
}

export const listStockIn = listByType(MOVEMENT_TYPES.IN)
export const listStockOut = listByType(MOVEMENT_TYPES.OUT)
export const listAdjustments = listByType(MOVEMENT_TYPES.ADJUSTMENT)
export const listDamaged = listByType(MOVEMENT_TYPES.DAMAGED)
export const listExpired = listByType(MOVEMENT_TYPES.EXPIRED)

export async function listStockTransfers(req, res) {
  const result = await listTransfers(req.tenantId, req.validated.query)
  return success(res, paginatedResult(result.items, result))
}

export async function createStockIn(req, res) {
  const { supplierId, branchId, lines } = req.validated.body
  const saved = await insertLedgerLines(
    req.tenantId,
    lines.map((line) => ({
      ...line,
      movementType: MOVEMENT_TYPES.IN,
      supplierId,
      branchId,
      createdBy: req.user.id,
    })),
  )
  return success(res, saved, 201)
}

export async function stockInFromOrder(req, res) {
  const data = await receivePurchaseOrder(req.tenantId, req.validated.body.purchaseOrderId, req.user.id)
  return success(res, data, 201)
}

export async function createAdjustment(req, res) {
  const row = await insertLedgerEvent(req.tenantId, {
    ...req.validated.body,
    movementType: MOVEMENT_TYPES.ADJUSTMENT,
    createdBy: req.user.id,
  })
  return success(res, row, 201)
}

export async function createDamaged(req, res) {
  const row = await insertLedgerEvent(req.tenantId, {
    ...req.validated.body,
    movementType: MOVEMENT_TYPES.DAMAGED,
    createdBy: req.user.id,
  })
  return success(res, row, 201)
}

export async function createStockOut(req, res) {
  const row = await insertLedgerEvent(req.tenantId, {
    ...req.validated.body,
    movementType: MOVEMENT_TYPES.OUT,
    createdBy: req.user.id,
  })
  return success(res, row, 201)
}

export async function createExpired(req, res) {
  const row = await insertLedgerEvent(req.tenantId, {
    ...req.validated.body,
    movementType: MOVEMENT_TYPES.EXPIRED,
    createdBy: req.user.id,
  })
  return success(res, row, 201)
}

export async function createTransfer(req, res) {
  const row = await createStockTransfer(req.tenantId, {
    ...req.validated.body,
    createdBy: req.user.id,
  })
  return success(res, row, 201)
}

export async function updateMovement(req, res) {
  const row = await updateLedgerEvent(req.tenantId, req.validated.params.id, req.validated.body)
  if (!row) return fail(res, 'Record not found', 404)
  return success(res, row)
}

export async function removeMovement(req, res) {
  const deleted = await deleteLedgerEvent(req.tenantId, req.validated.params.id)
  if (!deleted) return fail(res, 'Record not found', 404)
  return success(res, { deleted: true })
}
