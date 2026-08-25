import {
  createCategory,
  createProduct,
  deleteProduct,
  findOrCreateImportedCategory,
  findProductByBarcode,
  getProductById,
  getProductDetail,
  listCategories,
  listOffers,
  listProducts,
  listTaxes,
  setCategoryActive,
  updateCategory,
  updateProduct,
} from './product.model.js'
import { PRODUCT_TYPES } from '../../../config/constants.js'
import { generateBarcodeValue, generateItemCode, renderBarcodePng } from '../../../utils/barcode.util.js'
import { fail, success } from '../../../utils/response.util.js'
import { paginatedResult } from '../../../utils/pagination.util.js'

function uploadedUrl(file) {
  return file?.path || file?.secure_url || null
}

export async function categories(req, res) {
  const active = req.query?.active || 'all'
  return success(res, await listCategories(req.tenantId, { active }))
}

export async function taxes(req, res) {
  return success(res, await listTaxes(req.tenantId))
}

export async function offers(req, res) {
  return success(res, await listOffers(req.tenantId))
}

export async function addCategory(req, res) {
  try {
    const row = await createCategory(req.tenantId, { ...req.validated.body, imageUrl: uploadedUrl(req.file) })
    return success(res, row, 201)
  } catch (err) {
    if (err?.status) return fail(res, err.message, err.status)
    throw err
  }
}

export async function patchCategory(req, res) {
  try {
    const row = await updateCategory(req.tenantId, req.validated.params.id, {
      ...req.validated.body,
      ...(req.file ? { imageUrl: uploadedUrl(req.file) } : {}),
    })
    if (!row) return fail(res, 'Category not found', 404)
    return success(res, row)
  } catch (err) {
    if (err?.status) return fail(res, err.message, err.status)
    throw err
  }
}

export async function removeCategory(req, res) {
  try {
    const row = await setCategoryActive(req.tenantId, req.validated.params.id, false)
    if (!row) return fail(res, 'Category not found', 404)
    return success(res, { id: row.id, isActive: false, deactivated: true })
  } catch (err) {
    if (err?.status) return fail(res, err.message, err.status)
    throw err
  }
}

export async function products(req, res) {
  const result = await listProducts(req.tenantId, req.validated.query)
  return success(res, paginatedResult(result.items, result))
}

export async function addProduct(req, res) {
  const body = req.validated.body
  if (body.confirmed === false) {
    return fail(res, 'Confirmation is required before save', 422)
  }

  try {
    const row = await createProduct(req.tenantId, {
      ...body,
      imageUrl: uploadedUrl(req.file),
      itemCode: generateItemCode(),
      barcode: generateBarcodeValue(),
    })
    return success(res, row, 201)
  } catch (err) {
    if (err?.status) return fail(res, err.message, err.status)
    throw err
  }
}

export async function addBundle(req, res) {
  if (!req.validated.body.bundleItems?.length) {
    return fail(res, 'Bundle must include at least one item', 422)
  }
  req.validated.body.type = PRODUCT_TYPES.BUNDLE
  return addProduct(req, res)
}

export async function importItems(req, res) {
  const category = await findOrCreateImportedCategory(req.tenantId)
  const created = []
  const errors = []

  for (const [index, row] of req.validated.body.rows.entries()) {
    try {
      const product = await createProduct(req.tenantId, {
        name: row.name,
        categoryId: category.id,
        type: PRODUCT_TYPES.SINGLE,
        scale: row.scale || 'unit',
        itemCode: row.sku,
        barcode: row.barcode || generateBarcodeValue(),
        purchasePrice: row.purchasePrice ?? 0,
        sellingPrice: row.sellingPrice ?? 0,
        quantity: row.quantity ?? 0,
      })
      created.push(product)
    } catch (err) {
      const message =
        err?.code === '23505'
          ? `Row ${index + 1}: item code or barcode already exists (${row.sku})`
          : err?.message || `Row ${index + 1}: import failed`
      errors.push(message)
    }
  }

  if (!created.length) {
    return fail(res, errors[0] || 'No products imported', 409)
  }

  return success(
    res,
    {
      imported: created.length,
      failed: errors.length,
      errors: errors.length ? errors : undefined,
      items: created,
    },
    201,
  )
}

export async function scan(req, res) {
  const item = await findProductByBarcode(req.tenantId, req.validated.body.barcode)
  if (!item) return fail(res, 'No item found for this barcode', 404)
  return success(res, item)
}

export async function detail(req, res) {
  const row = await getProductDetail(req.tenantId, req.validated.params.id)
  if (!row) return fail(res, 'Item not found', 404)
  return success(res, row)
}

export async function printBarcode(req, res) {
  const item = await getProductById(req.tenantId, req.validated.params.id)
  if (!item) return fail(res, 'Item not found', 404)
  const png = await renderBarcodePng(item.barcode)
  res.setHeader('Content-Type', 'image/png')
  return res.send(png)
}

export async function update(req, res) {
  const row = await updateProduct(req.tenantId, req.validated.params.id, {
    ...req.validated.body,
    ...(req.file ? { imageUrl: uploadedUrl(req.file) } : {}),
  })
  if (!row) return fail(res, 'Item not found', 404)
  return success(res, row)
}

export async function remove(req, res) {
  const deactivated = await deleteProduct(req.tenantId, req.validated.params.id)
  if (!deactivated) return fail(res, 'Item not found', 404)
  return success(res, { id: req.validated.params.id, status: 'inactive', deactivated: true })
}
