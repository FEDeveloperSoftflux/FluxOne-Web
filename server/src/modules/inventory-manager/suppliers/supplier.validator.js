import { z } from 'zod'
import { activeFilter, empty, idParams, optionalBool, paginationQuery } from '../shared.validator.js'

export const listSuppliersSchema = z.object({
  body: empty,
  params: empty,
  query: paginationQuery.extend({
    q: z.string().optional(),
    active: activeFilter,
  }),
})

export const createSupplierSchema = z.object({
  body: z.object({
    companyName: z.string().min(1),
    companyPhone: z.string().optional(),
    representativeName: z.string().optional(),
    representativePhone: z.string().optional(),
    representativeEmail: z.preprocess((value) => (value === '' ? undefined : value), z.string().email().optional()),
    location: z.string().optional(),
    taxPaid: optionalBool,
    registrationNumber: z.string().optional(),
    bankAccountNumber: z.string().optional(),
  }),
  query: empty,
  params: empty,
})

export const updateSupplierSchema = z.object({
  body: createSupplierSchema.shape.body.partial().extend({
    isActive: optionalBool,
  }),
  query: empty,
  params: idParams,
})

export const supplierIdParamsSchema = z.object({
  body: empty,
  query: empty,
  params: idParams,
})

export const setSupplierActiveSchema = z.object({
  body: z.object({
    isActive: z.coerce.boolean(),
  }),
  query: empty,
  params: idParams,
})
