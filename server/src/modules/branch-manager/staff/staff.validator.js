import { z } from 'zod'
import { STAFF_STATUS } from '../../../config/constants.js'
import {
  empty,
  idParams,
  optionalString,
  optionalTime,
  optionalUuid,
  paginationQuery,
} from '../shared.validator.js'

const staffStatusEnum = z
  .enum([
    STAFF_STATUS.ACTIVE,
    STAFF_STATUS.INACTIVE,
    'open',
    'blocked',
  ])
  .transform((value) => {
    if (value === 'open') return STAFF_STATUS.ACTIVE
    if (value === 'blocked') return STAFF_STATUS.INACTIVE
    return value
  })

export const listStaffSchema = z.object({
  body: empty,
  params: empty,
  query: paginationQuery.extend({
    q: optionalString,
    designationId: optionalUuid,
    status: staffStatusEnum.optional(),
    branchId: optionalUuid,
    role: z.enum(['inventory_manager', 'cashier', 'production_staff', 'delivery_staff']).optional(),
  }),
})

export const createStaffSchema = z
  .object({
    body: z.object({
      fullName: z.string().min(1),
      /** Login ID (same field used by /auth/login as `id`). */
      email: z.string().min(3).max(190),
      password: z.string().min(8),
      role: z.enum(['inventory_manager', 'cashier', 'production_staff', 'delivery_staff']),
      designationId: optionalUuid,
      designation: optionalString,
      branchId: optionalUuid,
      hardwareDeviceId: optionalString,
      phone: optionalString,
      status: staffStatusEnum.optional(),
      scheduleStart: optionalTime,
      /** Single break time maps to break start; optional end for ranges. */
      scheduleBreakStart: optionalTime,
      scheduleBreakEnd: optionalTime,
      scheduleEnd: optionalTime,
    }),
    query: empty,
    params: empty,
  })
  .superRefine(({ body }, ctx) => {
    // Designation is optional when role maps to Inventory Manager / Cashier
    const hasDesignation = Boolean(body.designationId || body.designation?.trim())
    const hasRole = Boolean(body.role)
    if (!hasDesignation && !hasRole) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'role or designation is required',
        path: ['body', 'role'],
      })
    }
  })

export const updateStaffSchema = z.object({
  body: z.object({
    fullName: z.string().min(1).optional(),
    email: z.string().min(3).max(190).optional(),
    phone: optionalString,
    role: z.enum(['inventory_manager', 'cashier', 'production_staff', 'delivery_staff']).optional(),
    designationId: optionalUuid,
    designation: optionalString,
    branchId: optionalUuid,
    hardwareDeviceId: optionalString,
    status: staffStatusEnum.optional(),
    scheduleStart: optionalTime,
    scheduleBreakStart: optionalTime,
    scheduleBreakEnd: optionalTime,
    scheduleEnd: optionalTime,
    password: z.string().min(8).optional(),
  }),
  query: empty,
  params: idParams,
})

export const staffIdParamsSchema = z.object({
  body: empty,
  query: empty,
  params: idParams,
})

export const updateStaffStatusSchema = z.object({
  body: z.object({
    status: staffStatusEnum,
  }),
  query: empty,
  params: idParams,
})
