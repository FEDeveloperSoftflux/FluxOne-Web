/** Parse HH:MM or HH:MM:SS to minutes since midnight; returns null if empty/invalid. */
export function parseTimeToMinutes(value) {
  if (value == null || value === '') return null
  const text = String(value).trim()
  const match = text.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/)
  if (!match) return null
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours > 23 || minutes > 59) return null
  return hours * 60 + minutes
}

/**
 * Validate staff shift + break window.
 * Rules: start < end; break must be a range inside the shift when any break field is set.
 */
export function validateStaffSchedule(fields) {
  const start = parseTimeToMinutes(fields.scheduleStart)
  const end = parseTimeToMinutes(fields.scheduleEnd)
  const breakStart = parseTimeToMinutes(fields.scheduleBreakStart)
  const breakEnd = parseTimeToMinutes(fields.scheduleBreakEnd)

  const hasStart = fields.scheduleStart != null && String(fields.scheduleStart).trim() !== ''
  const hasEnd = fields.scheduleEnd != null && String(fields.scheduleEnd).trim() !== ''
  const hasBreakStart =
    fields.scheduleBreakStart != null && String(fields.scheduleBreakStart).trim() !== ''
  const hasBreakEnd =
    fields.scheduleBreakEnd != null && String(fields.scheduleBreakEnd).trim() !== ''

  if (hasStart !== hasEnd) {
    return 'Set both start and end time, or leave both empty'
  }

  if (hasStart && hasEnd) {
    if (start == null || end == null) {
      return 'Start and end time must be valid (HH:MM)'
    }
    if (start >= end) {
      return 'End time must be after start time'
    }
  }

  if (hasBreakStart !== hasBreakEnd) {
    return 'Set both break start and break end, or leave break empty'
  }

  if (hasBreakStart && hasBreakEnd) {
    if (breakStart == null || breakEnd == null) {
      return 'Break times must be valid (HH:MM)'
    }
    if (breakStart >= breakEnd) {
      return 'Break end must be after break start'
    }
    if (!hasStart || !hasEnd) {
      return 'Set shift start and end before adding a break'
    }
    if (breakStart < start || breakEnd > end) {
      return 'Break must fall within the shift (between start and end time)'
    }
  }

  return null
}

/** Staff create/edit fields (excludes schedule — use validateStaffSchedule). */
export function validateStaffForm(fields, { isEdit = false } = {}) {
  if (!String(fields.fullName || '').trim()) {
    return 'Name is required'
  }
  if (!String(fields.email || '').trim()) {
    return 'ID (login) is required'
  }
  if (!isEdit && (!fields.password || String(fields.password).length < 8)) {
    return 'Password must be at least 8 characters'
  }
  if (isEdit && fields.password && String(fields.password).length < 8) {
    return 'Password must be at least 8 characters'
  }
  return validateStaffSchedule(fields)
}
