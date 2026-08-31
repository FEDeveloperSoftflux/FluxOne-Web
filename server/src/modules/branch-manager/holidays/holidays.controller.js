import { createHoliday, listHolidays } from './holidays.model.js'
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

export async function holidaysList(req, res) {
  const rows = await listHolidays(req.tenantId)
  return success(res, rows)
}

export async function addHoliday(req, res) {
  const { name, startDate, endDate, employeeIds } = req.body

  if (!name || !startDate || !endDate) {
    return fail(res, 'Holiday name, start date, and end date are required', 400)
  }

  try {
    const dates = getDatesInRange(startDate, endDate)
    
    // 1. Create holiday entries
    for (const date of dates) {
      await createHoliday(req.tenantId, { name, date })
    }

    // 2. Mark attendance for employees as 'holiday'
    if (Array.isArray(employeeIds) && employeeIds.length > 0) {
      for (const employeeId of employeeIds) {
        for (const date of dates) {
          await upsertAttendance(req.tenantId, {
            staffId: employeeId,
            workDate: date,
            status: 'holiday',
            note: name,
            createdBy: req.user.id,
          })
        }
      }
    }

    return success(res, { message: 'Holiday created and applied to selected employees successfully' }, 201)
  } catch (err) {
    return fail(res, err.message || 'Failed to create holiday', 500)
  }
}
