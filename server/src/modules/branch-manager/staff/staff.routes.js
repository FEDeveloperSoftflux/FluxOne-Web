import { Router } from 'express'
import {
  createStaff,
  patchStaff,
  patchStaffStatus,
  removeStaff,
  staffDetail,
  staffList,
} from './staff.controller.js'
import { asyncHandler } from '../../../middlewares/error.middleware.js'
import { requirePermission } from '../../../middlewares/role.middleware.js'
import { upload } from '../../../middlewares/upload.middleware.js'
import { validate } from '../../../middlewares/validate.middleware.js'
import {
  createStaffSchema,
  listStaffSchema,
  staffIdParamsSchema,
  updateStaffSchema,
  updateStaffStatusSchema,
} from './staff.validator.js'

const router = Router()

router.get('/', requirePermission('staff:read'), validate(listStaffSchema), asyncHandler(staffList))
router.post(
  '/',
  requirePermission('staff:write'),
  upload.single('image'),
  validate(createStaffSchema),
  asyncHandler(createStaff),
)
router.get(
  '/:id',
  requirePermission('staff:read'),
  validate(staffIdParamsSchema),
  asyncHandler(staffDetail),
)
router.patch(
  '/:id',
  requirePermission('staff:write'),
  upload.single('image'),
  validate(updateStaffSchema),
  asyncHandler(patchStaff),
)
router.patch(
  '/:id/status',
  requirePermission('staff:write'),
  validate(updateStaffStatusSchema),
  asyncHandler(patchStaffStatus),
)
router.delete(
  '/:id',
  requirePermission('staff:write'),
  validate(staffIdParamsSchema),
  asyncHandler(removeStaff),
)

export default router
