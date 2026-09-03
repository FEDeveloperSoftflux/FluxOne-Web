import bcrypt from 'bcryptjs'
import {
  createStaffUser,
  deleteStaff,
  getStaffById,
  listStaff,
  setStaffStatus,
  updateStaff,
} from './staff.model.js'
import {
  assertStaffBranchAccess,
  resolveListBranchId,
  resolveScopedBranchId,
  sanitizeStaffWritePayload,
} from './staff.access.js'
import { ROLE_IDS, ROLES } from '../../../config/constants.js'
import { fail, success } from '../../../utils/response.util.js'
import { paginatedResult } from '../../../utils/pagination.util.js'
import { resolveUploadUrl } from '../../../utils/uploadUrl.util.js'

function bmBranchFilter(req) {
  if (req.user?.role === ROLES.BRANCH_MANAGER) {
    return req.user.branchId || null
  }
  return null
}

export async function staffList(req, res) {
  const query = { ...req.validated.query }
  query.branchId = resolveListBranchId(req, query.branchId)
  const result = await listStaff(req.tenantId, query)
  return success(res, paginatedResult(result.items, result))
}

export async function createStaff(req, res) {
  const body = req.validated.body
  const branchId = resolveScopedBranchId(req, body.branchId)

  if (req.user.role === ROLES.B2B_ADMIN && !branchId) {
    return fail(res, 'branchId is required when creating staff as B2B Admin', 400)
  }

  const passwordHash = await bcrypt.hash(body.password, 10)
  const created = await createStaffUser(req.tenantId, {
    ...body,
    role: body.role,
    roleId: ROLE_IDS[body.role],
    passwordHash,
    createdBy: req.user.id,
    branchId,
    imageUrl: resolveUploadUrl(req.file, req),
  })
  return success(res, created, 201)
}

export async function staffDetail(req, res) {
  const row = await getStaffById(req.tenantId, req.validated.params.id, {
    branchId: bmBranchFilter(req),
  })
  assertStaffBranchAccess(req, row)
  return success(res, row)
}

export async function patchStaff(req, res) {
  const body = sanitizeStaffWritePayload(req, { ...req.validated.body })
  if (body.password) {
    body.passwordHash = await bcrypt.hash(body.password, 10)
    delete body.password
  }
  const imageUrl = resolveUploadUrl(req.file, req)
  if (imageUrl) body.imageUrl = imageUrl

  const row = await updateStaff(req.tenantId, req.validated.params.id, body, {
    branchId: bmBranchFilter(req),
  })
  if (!row) return fail(res, 'Staff not found', 404)
  return success(res, row)
}

export async function patchStaffStatus(req, res) {
  const row = await setStaffStatus(
    req.tenantId,
    req.validated.params.id,
    req.validated.body.status,
    { branchId: bmBranchFilter(req) },
  )
  if (!row) return fail(res, 'Staff not found', 404)
  return success(res, row)
}

export async function removeStaff(req, res) {
  const deleted = await deleteStaff(req.tenantId, req.validated.params.id, {
    branchId: bmBranchFilter(req),
  })
  if (!deleted) return fail(res, 'Staff not found', 404)
  return success(res, { id: deleted.id, deleted: true })
}
