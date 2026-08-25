import { Router } from 'express'
import dashboardRoutes from './dashboard/dashboard.routes.js'
import staffRoutes from './staff/staff.routes.js'
import designationRoutes from './designations/designation.routes.js'
// import { attendanceList, markAttendance } from './attendance.controller.js'
// import { listScales, scoreStaff } from './performance.controller.js'
// import { addStockRequest, stockRequestList } from './stock_request.controller.js'
import { asyncHandler } from '../../middlewares/error.middleware.js'
import { requirePermission } from '../../middlewares/role.middleware.js'
import { validate } from '../../middlewares/validate.middleware.js'
import { attendanceSchema } from './attendance/attendance.validator.js'
import { performanceSchema } from './performance/performance.validator.js'
import { createStockRequestSchema, listStockRequestsSchema } from './stock/stock_request.validator.js'

const router = Router()

router.use('/dashboard', dashboardRoutes)
router.use('/staff', staffRoutes)
router.use('/designations', designationRoutes)
// router.get('/attendance', requirePermission('attendance:write'), asyncHandler(attendanceList))
// router.post(
//   '/attendance',
//   requirePermission('attendance:write'),
//   validate(attendanceSchema),
//   asyncHandler(markAttendance),
// )
// router.get('/performance/scales', requirePermission('performance:read'), asyncHandler(listScales))
// router.post(
//   '/performance/scores',
//   requirePermission('performance:read'),
//   validate(performanceSchema),
//   asyncHandler(scoreStaff),
// )
// router.get(
//   '/stock-requests',
//   requirePermission('stock:read'),
//   validate(listStockRequestsSchema),
//   asyncHandler(stockRequestList),
// )
// router.post(
//   '/stock-requests',
//   requirePermission('stock-requests:write'),
//   validate(createStockRequestSchema),
//   asyncHandler(addStockRequest),
// )

export default router
