import { z } from 'zod'

// Shift + break window validation for staff create/update.
function parseTimeToMinutes(value) {
  if (value == null || value === '') return null
  const text = String(value).trim()
  const match = text.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/)
  if (!match) return null
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours > 23 || minutes > 59) return null
  return hours * 60 + minutes
}

function hasValue(value) {
  return value != null && String(value).trim() !== ''
}

/** Append Zod issues when shift/break times are illogical. */
export function refineStaffSchedule(body, ctx) {
  const hasStart = hasValue(body.scheduleStart)
  const hasEnd = hasValue(body.scheduleEnd)
  const hasBreakStart = hasValue(body.scheduleBreakStart)
  const hasBreakEnd = hasValue(body.scheduleBreakEnd)

  if (hasStart !== hasEnd) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Set both schedule start and end, or leave both empty',
      path: ['body', 'scheduleEnd'],
    })
    return
  }

  if (hasStart && hasEnd) {
    const start = parseTimeToMinutes(body.scheduleStart)
    const end = parseTimeToMinutes(body.scheduleEnd)
    if (start == null || end == null) return
    if (start >= end) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Schedule end must be after start',
        path: ['body', 'scheduleEnd'],
      })
    }
  }

  if (hasBreakStart !== hasBreakEnd) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Set both break start and break end, or leave break empty',
      path: ['body', 'scheduleBreakEnd'],
    })
    return
  }

  if (!hasBreakStart) return

  const start = parseTimeToMinutes(body.scheduleStart)
  const end = parseTimeToMinutes(body.scheduleEnd)
  const breakStart = parseTimeToMinutes(body.scheduleBreakStart)
  const breakEnd = parseTimeToMinutes(body.scheduleBreakEnd)

  if (!hasStart || !hasEnd) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Shift start and end are required when setting a break',
      path: ['body', 'scheduleStart'],
    })
    return
  }

  if (breakStart == null || breakEnd == null) return

  if (breakStart >= breakEnd) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Break end must be after break start',
      path: ['body', 'scheduleBreakEnd'],
    })
  }

  if (breakStart < start || breakEnd > end) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Break must fall within the shift (between start and end)',
      path: ['body', 'scheduleBreakStart'],
    })
  }
}
