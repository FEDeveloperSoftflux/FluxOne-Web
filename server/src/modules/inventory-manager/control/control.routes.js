import { Router } from 'express'
import {
  createAdjustment,
  createDamaged,
  createExpired,
  createStockIn,
  createStockOut,
  createTransfer,
  listAdjustments,
  listDamaged,
  listExpired,
  listStockIn,
  listStockOut,
  listStockTransfers,
  removeMovement,
  stockInFromOrder,
  updateMovement,
} from './control.controller.js'
import { asyncHandler } from '../../../middlewares/error.middleware.js'
import { requirePermission } from '../../../middlewares/role.middleware.js'
import { validate } from '../../../middlewares/validate.middleware.js'
import {
  adjustmentSchema,
  damagedSchema,
  expiredSchema,
  ledgerIdParamsSchema,
  listLedgerSchema,
  patchMovementSchema,
  stockInFromOrderSchema,
  stockInSchema,
  stockOutSchema,
  transferSchema,
} from './control.validator.js'

const router = Router()

router.get('/stock-in', requirePermission('stock:read'), validate(listLedgerSchema), asyncHandler(listStockIn))
router.post('/stock-in', requirePermission('stock:write'), validate(stockInSchema), asyncHandler(createStockIn))
router.post(
  '/stock-in/from-order',
  requirePermission('stock:write'),
  validate(stockInFromOrderSchema),
  asyncHandler(stockInFromOrder),
)

router.get('/stock-out', requirePermission('stock:read'), validate(listLedgerSchema), asyncHandler(listStockOut))
router.post('/stock-out', requirePermission('stock:write'), validate(stockOutSchema), asyncHandler(createStockOut))

router.get('/adjustments', requirePermission('stock:read'), validate(listLedgerSchema), asyncHandler(listAdjustments))
router.post('/adjustments', requirePermission('stock:write'), validate(adjustmentSchema), asyncHandler(createAdjustment))
router.patch(
  '/adjustments/:id',
  requirePermission('stock:write'),
  validate(patchMovementSchema),
  asyncHandler(updateMovement),
)
router.delete(
  '/adjustments/:id',
  requirePermission('stock:write'),
  validate(ledgerIdParamsSchema),
  asyncHandler(removeMovement),
)

router.get('/damaged', requirePermission('stock:read'), validate(listLedgerSchema), asyncHandler(listDamaged))
router.post('/damaged', requirePermission('stock:write'), validate(damagedSchema), asyncHandler(createDamaged))
router.patch(
  '/damaged/:id',
  requirePermission('stock:write'),
  validate(patchMovementSchema),
  asyncHandler(updateMovement),
)
router.delete(
  '/damaged/:id',
  requirePermission('stock:write'),
  validate(ledgerIdParamsSchema),
  asyncHandler(removeMovement),
)

router.get('/expired', requirePermission('stock:read'), validate(listLedgerSchema), asyncHandler(listExpired))
router.post('/expired', requirePermission('stock:write'), validate(expiredSchema), asyncHandler(createExpired))
router.patch(
  '/expired/:id',
  requirePermission('stock:write'),
  validate(patchMovementSchema),
  asyncHandler(updateMovement),
)
router.delete(
  '/expired/:id',
  requirePermission('stock:write'),
  validate(ledgerIdParamsSchema),
  asyncHandler(removeMovement),
)

router.get('/transfers', requirePermission('stock:read'), validate(listLedgerSchema), asyncHandler(listStockTransfers))
router.post('/transfers', requirePermission('stock:write'), validate(transferSchema), asyncHandler(createTransfer))

export default router
