import { createLeave, listLeaves } from './leaves.model.js'
import { upsertAttendance } from '../attendance/attendance.model.js'
import { success, fail } from '../../../utils/response.util.js'

function getDatesInRange(startDate, endDate) {
  const dates = []
  let current = new Date(startDate)
  const last = new Date(endDate)
  while (current <= last) {
    dates.push(current.toISOString().split('T')[0])
    current.setDate(current.getDate() + 1)
  }
  return dates
}

export async function leavesList(req, res) {
  const rows = await listLeaves(req.tenantId)
  return success(res, rows)
}

export async function addLeave(req, res) {
  const { employeeIds, startDate, endDate, reason } = req.body

  if (!Array.isArray(employeeIds) || employeeIds.length === 0 || !startDate || !endDate) {
    return fail(res, 'Employees list, start date, and end date are required', 400)
  }

  try {
    const dates = getDatesInRange(startDate, endDate)

    for (const employeeId of employeeIds) {
      // 1. Create leave entry
      await createLeave(req.tenantId, {
        staffId: employeeId,
        startDate,
        endDate,
        reason,
        status: 'approved',
      })

      // 2. Mark attendance as 'leave'
      for (const date of dates) {
        await upsertAttendance(req.tenantId, {
          staffId: employeeId,
          workDate: date,
          status: 'leave',
          note: reason || 'Leave approved',
          createdBy: req.user.id,
        })
      }
    }

    return success(res, { message: 'Leave approved and attendance marked successfully' }, 201)
  } catch (err) {
    return fail(res, err.message || 'Failed to create leave', 500)
  }
}
