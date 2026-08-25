import { z } from 'zod'
import { catalogFilters, empty, idParams, paginationQuery } from '../shared.validator.js'

export const listLedgerSchema = z.object({
  body: empty,
  params: empty,
  query: catalogFilters.merge(paginationQuery).extend({
    movementType: z.string().optional(),
  }),
})

export const stockInSchema = z.object({
  body: z.object({
    supplierId: z.string().uuid().optional(),
    branchId: z.string().uuid().optional(),
    lines: z
      .array(
        z.object({
          productId: z.string().uuid(),
          scale: z.string().min(1),
          quantity: z.coerce.number().positive(),
          unitCost: z.coerce.number().nonnegative().optional(),
        }),
      )
      .min(1),
  }),
  query: empty,
  params: empty,
})

export const stockInFromOrderSchema = z.object({
  body: z.object({
    purchaseOrderId: z.string().uuid(),
  }),
  query: empty,
  params: empty,
})

export const stockMovementSchema = z.object({
  body: z.object({
    productId: z.string().uuid(),
    quantity: z.coerce.number(),
    scale: z.string().min(1),
    reason: z.string().min(3).optional(),
    supplierId: z.string().uuid().optional(),
    damagedByUserId: z.string().uuid().optional(),
    damagedLocation: z.enum(['traveling', 'warehouse', 'item_transfer', 'other']).optional(),
  }),
  query: empty,
  params: empty,
})

export const adjustmentSchema = stockMovementSchema.extend({
  body: stockMovementSchema.shape.body.extend({
    reason: z.string().min(3),
  }),
})

export const damagedSchema = stockMovementSchema.extend({
  body: stockMovementSchema.shape.body.extend({
    damagedByUserId: z.string().uuid(),
    damagedLocation: z.enum(['traveling', 'warehouse', 'item_transfer', 'other']),
    reason: z.string().min(3),
    quantity: z.coerce.number().positive(),
  }),
})

export const stockOutSchema = stockMovementSchema.extend({
  body: stockMovementSchema.shape.body.extend({
    quantity: z.coerce.number().positive(),
  }),
})

export const expiredSchema = stockMovementSchema.extend({
  body: stockMovementSchema.shape.body.extend({
    quantity: z.coerce.number().positive(),
    expiresAt: z.coerce.date(),
    supplierId: z.string().uuid().optional(),
    reason: z.string().min(3).optional(),
  }),
})

export const transferSchema = z.object({
  body: z.object({
    productId: z.string().uuid(),
    fromBranchId: z.string().uuid(),
    toBranchId: z.string().uuid(),
    quantity: z.coerce.number().positive(),
    scale: z.string().min(1),
    reason: z.string().min(3).optional(),
  }),
  query: empty,
  params: empty,
})

export const ledgerIdParamsSchema = z.object({
  body: empty,
  query: empty,
  params: idParams,
})

export const patchMovementSchema = z.object({
  body: z.object({
    quantity: z.coerce.number().optional(),
    reason: z.string().min(3).optional(),
    damagedByUserId: z.string().uuid().optional(),
    damagedLocation: z.enum(['traveling', 'warehouse', 'item_transfer', 'other']).optional(),
    expiresAt: z.coerce.date().optional(),
    supplierId: z.string().uuid().optional(),
  }),
  query: empty,
  params: idParams,
})
