import { z } from 'zod'
import { empty } from '../shared.validator.js'

export const attendanceSchema = z.object({
  body: z.object({
    staffId: z.string().uuid(),
    workDate: z.string().min(8),
    status: z.enum(['present', 'absent', 'late', 'holiday', 'leave']),
    note: z.string().optional(),
  }),
  query: empty,
  params: empty,
})
