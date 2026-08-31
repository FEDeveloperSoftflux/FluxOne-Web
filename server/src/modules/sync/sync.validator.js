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
  originalInvoiceId: z.string().optional(),
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
  deviceId: z.string().optional(),
  branchId: z.string().uuid().optional(),
  events: z.array(syncEventSchema).min(1),
})

export const bootstrapQuerySchema = z.object({
  branchId: z.string().uuid(),
})

export const deltaQuerySchema = z.object({
  branchId: z.string().uuid(),
  since: z.string().min(1),
})

/** Map POS field names to cloud schema before validation. */
export function normalizePosSalePayload(raw = {}) {
  const payload = { ...raw }

  if (Array.isArray(raw.items) && !raw.lines) {
    payload.lines = raw.items
  }

  if (raw.cashierId && !payload.staffUserId) {
    payload.staffUserId = raw.cashierId
  }

  if (raw.invoiceId && !payload.saleNumber) {
    payload.saleNumber = raw.invoiceId
  }

  if (raw.discount !== undefined && payload.discountAmount === undefined) {
    payload.discountAmount = raw.discount
  }
  if (raw.tax !== undefined && payload.taxAmount === undefined) {
    payload.taxAmount = raw.tax
  }
  if (raw.total !== undefined && payload.finalAmount === undefined) {
    payload.finalAmount = raw.total
  }
  if (raw.tendered !== undefined && payload.paidAmount === undefined) {
    payload.paidAmount = raw.tendered
  }
  if (raw.changeDue !== undefined && payload.returnAmount === undefined) {
    payload.returnAmount = raw.changeDue
  }

  if (raw.refundAmount !== undefined && payload.finalAmount === undefined) {
    payload.finalAmount = raw.refundAmount
  }

  if (Array.isArray(payload.lines)) {
    payload.lines = payload.lines.map((line) => ({
      ...line,
      discountAmount: line.discountAmount ?? line.discount,
      taxAmount: line.taxAmount ?? line.tax,
    }))
  }

  return payload
}

export function normalizeSyncEventPayload(eventType, payload) {
  if (eventType === 'sale' || eventType === 'refund') {
    return normalizePosSalePayload(payload)
  }
  return payload || {}
}

export function validateSalePayload(payload) {
  const normalized = normalizePosSalePayload(payload)
  return salePayloadSchema.safeParse(normalized)
}

export function validateRefundPayload(payload) {
  const normalized = normalizePosSalePayload(payload)
  const parsed = salePayloadSchema.safeParse(normalized)
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

export function parseSchemaOrThrow(schema, data, label = 'Request') {
  const result = schema.safeParse(data)
  if (!result.success) {
    const message = result.error.issues.map((i) => i.message).join('; ') || `${label} validation failed`
    const err = new Error(message)
    err.status = 422
    throw err
  }
  return result.data
}
