import { Router } from 'express'
import { changePassword, login, logout, me, refresh, updateMe } from './auth.controller.js'
import { authMiddleware } from '../../middlewares/auth.middleware.js'
import { asyncHandler } from '../../middlewares/error.middleware.js'
import { validate } from '../../middlewares/validate.middleware.js'
import {
  changePasswordSchema,
  loginSchema,
  refreshSchema,
  updateProfileSchema,
} from './auth.validator.js'

const router = Router()

router.post('/login', validate(loginSchema), asyncHandler(login))
router.post('/refresh', validate(refreshSchema), asyncHandler(refresh))
router.post('/logout', authMiddleware, asyncHandler(logout))
router.get('/me', authMiddleware, asyncHandler(me))
router.patch('/me', authMiddleware, validate(updateProfileSchema), asyncHandler(updateMe))
router.post(
  '/change-password',
  authMiddleware,
  validate(changePasswordSchema),
  asyncHandler(changePassword),
)

export default router
