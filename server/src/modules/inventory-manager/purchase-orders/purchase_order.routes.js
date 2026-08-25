import { Router } from 'express'
import { approve, cancel, detail, generate, history, list, print, sendSmsToSupplier } from './purchase_order.controller.js'
import { asyncHandler } from '../../../middlewares/error.middleware.js'
import { requirePermission } from '../../../middlewares/role.middleware.js'
import { validate } from '../../../middlewares/validate.middleware.js'
import { generateOrderSchema, listOrdersSchema, orderIdParamsSchema } from './purchase_order.validator.js'

const router = Router()

router.get('/', requirePermission('orders:read'), validate(listOrdersSchema), asyncHandler(list))
router.post('/', requirePermission('orders:generate'), validate(generateOrderSchema), asyncHandler(generate))
router.get('/:id', requirePermission('orders:read'), validate(orderIdParamsSchema), asyncHandler(detail))
router.get('/:id/history', requirePermission('orders:read'), validate(orderIdParamsSchema), asyncHandler(history))
router.get('/:id/print', requirePermission('orders:read'), validate(orderIdParamsSchema), asyncHandler(print))
router.post('/:id/approve', requirePermission('orders:approve'), validate(orderIdParamsSchema), asyncHandler(approve))
router.post('/:id/send-sms', requirePermission('orders:generate'), validate(orderIdParamsSchema), asyncHandler(sendSmsToSupplier))
router.post('/:id/cancel', requirePermission('orders:approve'), validate(orderIdParamsSchema), asyncHandler(cancel))

export default router
