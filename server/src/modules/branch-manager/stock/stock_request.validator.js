import { z } from 'zod'
import { empty } from '../shared.validator.js'

export const listStockRequestsSchema = z.object({
  body: empty,
  params: empty,
  query: z.object({
    status: z.enum(['open', 'closed']).optional(),
  }),
})

export const createStockRequestSchema = z.object({
  body: z.object({
    productId: z.string().uuid(),
    kind: z.enum(['alert', 'request']),
    remainingQuantity: z.coerce.number().nonnegative().optional(),
    branchId: z.string().uuid().optional(),
  }),
  query: empty,
  params: empty,
})
