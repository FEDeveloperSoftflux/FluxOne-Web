import { z } from 'zod'
import { empty } from '../shared.validator.js'

export const performanceSchema = z.object({
  body: z.object({
    staffId: z.string().uuid(),
    scaleId: z.string().uuid(),
    points: z.coerce.number().nonnegative(),
  }),
  query: empty,
  params: empty,
})
