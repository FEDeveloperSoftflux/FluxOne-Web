import {
  createSupplier,
  deleteSupplier,
  listSuppliers,
  setSupplierActive,
  updateSupplier,
} from './supplier.model.js'
import { fail, success } from '../../../utils/response.util.js'
import { paginatedResult } from '../../../utils/pagination.util.js'

function fileUrl(file) {
  return file?.path || file?.secure_url || null
}

function filesFromRequest(req) {
  return {
    imageUrl: fileUrl(req.files?.image?.[0] || req.file),
    signatureUrl: fileUrl(req.files?.signature?.[0]),
  }
}

export async function list(req, res) {
  const result = await listSuppliers(req.tenantId, req.validated.query)
  return success(res, paginatedResult(result.items, result))
}

export async function create(req, res) {
  const row = await createSupplier(req.tenantId, { ...req.validated.body, ...filesFromRequest(req) })
  return success(res, row, 201)
}

export async function update(req, res) {
  const row = await updateSupplier(req.tenantId, req.validated.params.id, {
    ...req.validated.body,
    ...filesFromRequest(req),
  })
  if (!row) return fail(res, 'Supplier not found', 404)
  return success(res, row)
}

export async function setActive(req, res) {
  const row = await setSupplierActive(req.tenantId, req.validated.params.id, req.validated.body.isActive)
  if (!row) return fail(res, 'Supplier not found', 404)
  return success(res, row)
}

/** Soft-deactivate (Active → Inactive). Keeps purchase order history intact. */
export async function remove(req, res) {
  const deactivated = await deleteSupplier(req.tenantId, req.validated.params.id)
  if (!deactivated) return fail(res, 'Supplier not found', 404)
  return success(res, { id: req.validated.params.id, isActive: false, deactivated: true })
}
