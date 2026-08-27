import {
  createStockTransfer,
  deleteLedgerEvent,
  insertLedgerEvent,
  insertLedgerLines,
  listLedger,
  listTransfers,
  processDueExpirations,
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

function updateByType(movementType) {
  return async (req, res) => {
    const row = await updateLedgerEvent(
      req.tenantId,
      req.validated.params.id,
      req.validated.body,
      movementType,
    )
    if (!row) return fail(res, 'Record not found', 404)
    return success(res, row)
  }
}

function removeByType(movementType) {
  return async (req, res) => {
    const deleted = await deleteLedgerEvent(req.tenantId, req.validated.params.id, movementType)
    if (!deleted) return fail(res, 'Record not found', 404)
    return success(res, { deleted: true })
  }
}

export const listStockIn = listByType(MOVEMENT_TYPES.IN)
export const listAdjustments = listByType(MOVEMENT_TYPES.ADJUSTMENT)
export const listDamaged = listByType(MOVEMENT_TYPES.DAMAGED)

/** Stock-out history: sales + damaged + expired (no manual create). */
export async function listStockOut(req, res) {
  const result = await listLedger(req.tenantId, {
    ...req.validated.query,
    movementTypes: [MOVEMENT_TYPES.OUT, MOVEMENT_TYPES.DAMAGED, MOVEMENT_TYPES.EXPIRED],
  })
  return success(res, paginatedResult(result.items, result))
}

/** Process past-due stock-in lots, then list expired history. */
export async function listExpired(req, res) {
  try {
    await processDueExpirations(req.tenantId, req.user?.id || null)
  } catch (err) {
    console.error('[listExpired] processDueExpirations', err.message)
  }
  const result = await listLedger(req.tenantId, {
    ...req.validated.query,
    movementType: MOVEMENT_TYPES.EXPIRED,
  })
  return success(res, paginatedResult(result.items, result))
}

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

export const updateAdjustment = updateByType(MOVEMENT_TYPES.ADJUSTMENT)
export const updateDamaged = updateByType(MOVEMENT_TYPES.DAMAGED)
export const updateExpired = updateByType(MOVEMENT_TYPES.EXPIRED)

export const removeAdjustment = removeByType(MOVEMENT_TYPES.ADJUSTMENT)
export const removeDamaged = removeByType(MOVEMENT_TYPES.DAMAGED)
export const removeExpired = removeByType(MOVEMENT_TYPES.EXPIRED)
