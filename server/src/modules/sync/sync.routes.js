import { Router } from 'express'
import { pull, push } from './sync.controller.js'
import { asyncHandler } from '../../middlewares/error.middleware.js'
import { requirePermission } from '../../middlewares/role.middleware.js'

const router = Router()

router.post('/push', requirePermission('sync:push'), asyncHandler(push))
router.get('/pull', requirePermission('sync:pull'), asyncHandler(pull))

export default router
