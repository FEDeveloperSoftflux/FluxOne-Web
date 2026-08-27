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
import {
  resolveInventoryBranchId,
  resolveInventoryScope,
} from '../shared.access.js'
import { MOVEMENT_TYPES } from '../../../config/constants.js'
import { fail, success } from '../../../utils/response.util.js'
import { paginatedResult } from '../../../utils/pagination.util.js'

function scopeError(res, err) {
  if (err?.status) return fail(res, err.message, err.status)
  throw err
}

function listByType(movementType) {
  return async (req, res) => {
    try {
      const { tenantId, branchId } = resolveInventoryScope(req)
      const result = await listLedger(tenantId, { ...req.validated.query, movementType, branchId })
      return success(res, paginatedResult(result.items, result))
    } catch (err) {
      return scopeError(res, err)
    }
  }
}

function updateByType(movementType) {
  return async (req, res) => {
    try {
      const { tenantId, branchId } = resolveInventoryScope(req)
      const row = await updateLedgerEvent(
        tenantId,
        req.validated.params.id,
        req.validated.body,
        movementType,
        { branchId },
      )
      if (!row) return fail(res, 'Record not found', 404)
      return success(res, row)
    } catch (err) {
      return scopeError(res, err)
    }
  }
}

function removeByType(movementType) {
  return async (req, res) => {
    try {
      const { tenantId, branchId } = resolveInventoryScope(req)
      const deleted = await deleteLedgerEvent(tenantId, req.validated.params.id, movementType, {
        branchId,
      })
      if (!deleted) return fail(res, 'Record not found', 404)
      return success(res, { deleted: true })
    } catch (err) {
      return scopeError(res, err)
    }
  }
}

export const listStockIn = listByType(MOVEMENT_TYPES.IN)
export const listAdjustments = listByType(MOVEMENT_TYPES.ADJUSTMENT)
export const listDamaged = listByType(MOVEMENT_TYPES.DAMAGED)

// Stock-out history: sales + damaged + expired (no manual create).
export async function listStockOut(req, res) {
  try {
    const { tenantId, branchId } = resolveInventoryScope(req)
    const result = await listLedger(tenantId, {
      ...req.validated.query,
      movementTypes: [MOVEMENT_TYPES.OUT, MOVEMENT_TYPES.DAMAGED, MOVEMENT_TYPES.EXPIRED],
      branchId,
    })
    return success(res, paginatedResult(result.items, result))
  } catch (err) {
    return scopeError(res, err)
  }
}

// Process past-due stock-in lots, then list expired history.
export async function listExpired(req, res) {
  try {
    const { tenantId, branchId } = resolveInventoryScope(req)
    try {
      await processDueExpirations(tenantId, req.user?.id || null, { branchId })
    } catch (err) {
      console.error('[listExpired] processDueExpirations', err.message)
    }
    const result = await listLedger(tenantId, {
      ...req.validated.query,
      movementType: MOVEMENT_TYPES.EXPIRED,
      branchId,
    })
    return success(res, paginatedResult(result.items, result))
  } catch (err) {
    return scopeError(res, err)
  }
}

export async function listStockTransfers(req, res) {
  try {
    const { tenantId, branchId } = resolveInventoryScope(req)
    const result = await listTransfers(tenantId, { ...req.validated.query, branchId })
    return success(res, paginatedResult(result.items, result))
  } catch (err) {
    return scopeError(res, err)
  }
}

export async function createStockIn(req, res) {
  try {
    const { tenantId } = resolveInventoryScope(req)
    const { supplierId, branchId: bodyBranchId, lines } = req.validated.body
    // Branch scope: IM forces JWT branch; B2B may pass body branchId
    const branchId = resolveInventoryBranchId(req, bodyBranchId)
    const saved = await insertLedgerLines(
      tenantId,
      lines.map((line) => ({
        ...line,
        movementType: MOVEMENT_TYPES.IN,
        supplierId,
        branchId,
        scopeBranchId: branchId,
        createdBy: req.user.id,
      })),
    )
    return success(res, saved, 201)
  } catch (err) {
    return scopeError(res, err)
  }
}

export async function stockInFromOrder(req, res) {
  try {
    const { tenantId, branchId } = resolveInventoryScope(req)
    const data = await receivePurchaseOrder(
      tenantId,
      req.validated.body.purchaseOrderId,
      req.user.id,
      { branchId },
    )
    return success(res, data, 201)
  } catch (err) {
    return scopeError(res, err)
  }
}

export async function createAdjustment(req, res) {
  try {
    const { tenantId, branchId } = resolveInventoryScope(req)
    const row = await insertLedgerEvent(tenantId, {
      ...req.validated.body,
      movementType: MOVEMENT_TYPES.ADJUSTMENT,
      createdBy: req.user.id,
      scopeBranchId: branchId,
    })
    return success(res, row, 201)
  } catch (err) {
    return scopeError(res, err)
  }
}

export async function createDamaged(req, res) {
  try {
    const { tenantId, branchId } = resolveInventoryScope(req)
    const row = await insertLedgerEvent(tenantId, {
      ...req.validated.body,
      movementType: MOVEMENT_TYPES.DAMAGED,
      createdBy: req.user.id,
      scopeBranchId: branchId,
    })
    return success(res, row, 201)
  } catch (err) {
    return scopeError(res, err)
  }
}

export async function createStockOut(req, res) {
  try {
    const { tenantId, branchId } = resolveInventoryScope(req)
    const row = await insertLedgerEvent(tenantId, {
      ...req.validated.body,
      movementType: MOVEMENT_TYPES.OUT,
      createdBy: req.user.id,
      scopeBranchId: branchId,
    })
    return success(res, row, 201)
  } catch (err) {
    return scopeError(res, err)
  }
}

export async function createExpired(req, res) {
  try {
    const { tenantId, branchId } = resolveInventoryScope(req)
    const row = await insertLedgerEvent(tenantId, {
      ...req.validated.body,
      movementType: MOVEMENT_TYPES.EXPIRED,
      createdBy: req.user.id,
      scopeBranchId: branchId,
    })
    return success(res, row, 201)
  } catch (err) {
    return scopeError(res, err)
  }
}

export async function createTransfer(req, res) {
  try {
    const { tenantId, branchId } = resolveInventoryScope(req)
    // Branch scope: IM must transfer from JWT branch
    const fromBranchId = resolveInventoryBranchId(req, req.validated.body.fromBranchId)
    const row = await createStockTransfer(tenantId, {
      ...req.validated.body,
      fromBranchId,
      createdBy: req.user.id,
      scopeBranchId: branchId,
    })
    return success(res, row, 201)
  } catch (err) {
    return scopeError(res, err)
  }
}

export const updateAdjustment = updateByType(MOVEMENT_TYPES.ADJUSTMENT)
export const updateDamaged = updateByType(MOVEMENT_TYPES.DAMAGED)
export const updateExpired = updateByType(MOVEMENT_TYPES.EXPIRED)

export const removeAdjustment = removeByType(MOVEMENT_TYPES.ADJUSTMENT)
export const removeDamaged = removeByType(MOVEMENT_TYPES.DAMAGED)
export const removeExpired = removeByType(MOVEMENT_TYPES.EXPIRED)
