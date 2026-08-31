import { z } from 'zod'
import { SALE_STATUS } from '../../config/constants.js'

export const saleLineSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.coerce.number().positive(),
  scale: z.string().min(1).optional(),
  unitPrice: z.coerce.number().nonnegative().optional(),
  discountAmount: z.coerce.number().nonnegative().optional(),
  taxAmount: z.coerce.number().nonnegative().optional(),
  lineTotal: z.coerce.number().nonnegative().optional(),
  isExchange: z.boolean().optional(),
})

export const salePayloadSchema = z.object({
  localSaleId: z.string().optional(),
  saleNumber: z.string().optional(),
  soldAt: z.string().optional(),
  counterCode: z.string().optional(),
  staffUserId: z.string().uuid().optional(),
  paymentMethod: z.string().optional(),
  subtotal: z.coerce.number().nonnegative().optional(),
  taxAmount: z.coerce.number().nonnegative().optional(),
  discountAmount: z.coerce.number().nonnegative().optional(),
  finalAmount: z.coerce.number().nonnegative().optional(),
  paidAmount: z.coerce.number().nonnegative().optional(),
  returnAmount: z.coerce.number().nonnegative().optional(),
  status: z
    .enum([
      SALE_STATUS.COMPLETED,
      SALE_STATUS.REFUNDED,
      SALE_STATUS.PARTIAL_REFUND,
      SALE_STATUS.VOID,
    ])
    .optional(),
  lines: z.array(saleLineSchema).min(1),
  reason: z.string().optional(),
})

export const syncEventSchema = z.object({
  clientEventId: z.string().min(1),
  eventType: z.enum(['sale', 'refund', 'cashier_log', 'attendance']),
  payload: z.record(z.string(), z.any()),
  deviceId: z.string().optional(),
})

export const pushBodySchema = z.object({
  events: z.array(syncEventSchema).min(1),
})

export const bootstrapQuerySchema = z.object({
  branchId: z.string().uuid(),
})

export const deltaQuerySchema = z.object({
  branchId: z.string().uuid(),
  since: z.string().min(1),
})

export function validateSalePayload(payload) {
  return salePayloadSchema.safeParse(payload)
}

export function validateRefundPayload(payload) {
  const parsed = salePayloadSchema.safeParse(payload)
  if (!parsed.success) return parsed
  const status = parsed.data.status
  if (status && status !== SALE_STATUS.REFUNDED && status !== SALE_STATUS.PARTIAL_REFUND) {
    return {
      success: false,
      error: new z.ZodError([
        {
          code: 'custom',
          message: 'Refund events require status refunded or partial_refund',
          path: ['status'],
        },
      ]),
    }
  }
  return parsed
}
