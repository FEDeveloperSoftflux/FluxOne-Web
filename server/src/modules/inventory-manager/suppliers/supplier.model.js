import { tenantQuery } from '../../../config/db.js'

const supplierSelect = `
  id,
  company_name AS "companyName",
  image_url AS "imageUrl",
  company_phone AS "companyPhone",
  representative_name AS "representativeName",
  representative_phone AS "representativePhone",
  representative_email AS "representativeEmail",
  location,
  tax_paid AS "taxPaid",
  registration_number AS "registrationNumber",
  bank_account_number AS "bankAccountNumber",
  signature_url AS "signatureUrl",
  is_active AS "isActive"
`

function activeSqlClause(active) {
  if (active === 'all') return ''
  if (active === 'inactive') return 'AND is_active = false'
  return 'AND is_active = true'
}

export async function listSuppliers(tenantId, { q, page = 1, limit = 8, active = 'active' } = {}) {
  const safePage = Math.max(1, Number(page) || 1)
  const safeLimit = Math.min(50, Math.max(1, Number(limit) || 8))
  const offset = (safePage - 1) * safeLimit
  const activeClause = activeSqlClause(active)

  const { rows } = await tenantQuery(
    tenantId,
    `
      SELECT ${supplierSelect},
        count(*) OVER()::int AS "_total"
      FROM suppliers
      WHERE tenant_id = $1
        ${activeClause}
        AND (
          $2::text IS NULL
          OR company_name ILIKE '%' || $2 || '%'
          OR id::text ILIKE '%' || $2 || '%'
        )
      ORDER BY company_name
      LIMIT $3 OFFSET $4
    `,
    [q || null, safeLimit, offset],
  )

  const total = rows[0]?._total || 0
  const items = rows.map(({ _total, ...item }) => item)
  return { items, total, page: safePage, limit: safeLimit }
}

export async function createSupplier(tenantId, payload) {
  const { rows } = await tenantQuery(
    tenantId,
    `
      INSERT INTO suppliers (
        tenant_id, company_name, image_url, company_phone, representative_name,
        representative_phone, representative_email, location, tax_paid,
        registration_number, bank_account_number, signature_url, is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true)
      RETURNING ${supplierSelect}
    `,
    [
      payload.companyName,
      payload.imageUrl || null,
      payload.companyPhone || null,
      payload.representativeName || null,
      payload.representativePhone || null,
      payload.representativeEmail || null,
      payload.location || null,
      payload.taxPaid ?? false,
      payload.registrationNumber || null,
      payload.bankAccountNumber || null,
      payload.signatureUrl || null,
    ],
  )
  return rows[0]
}

export async function updateSupplier(tenantId, id, payload) {
  const updatableColumns = {
    companyName: 'company_name',
    companyPhone: 'company_phone',
    representativeName: 'representative_name',
    representativePhone: 'representative_phone',
    representativeEmail: 'representative_email',
    location: 'location',
    taxPaid: 'tax_paid',
    registrationNumber: 'registration_number',
    bankAccountNumber: 'bank_account_number',
    imageUrl: 'image_url',
    signatureUrl: 'signature_url',
    isActive: 'is_active',
  }

  const setClauses = []
  const params = [id]

  for (const [payloadKey, column] of Object.entries(updatableColumns)) {
    if (!(payloadKey in payload)) continue
    const paramIndex = params.length + 2
    setClauses.push(`${column} = $${paramIndex}`)
    params.push(payload[payloadKey] ?? null)
  }

  if (!setClauses.length) {
    const { rows } = await tenantQuery(
      tenantId,
      `
        SELECT ${supplierSelect}
        FROM suppliers
        WHERE tenant_id = $1 AND id = $2
        LIMIT 1
      `,
      [id],
    )
    return rows[0] || null
  }

  const { rows } = await tenantQuery(
    tenantId,
    `
      UPDATE suppliers
      SET ${setClauses.join(', ')}
      WHERE tenant_id = $1 AND id = $2
      RETURNING ${supplierSelect}
    `,
    params,
  )
  return rows[0] || null
}

export async function setSupplierActive(tenantId, id, isActive) {
  const { rows } = await tenantQuery(
    tenantId,
    `
      UPDATE suppliers
      SET is_active = $2
      WHERE tenant_id = $1 AND id = $3
      RETURNING ${supplierSelect}
    `,
    [isActive, id],
  )
  return rows[0] || null
}

/** Soft-deactivate supplier (replaces hard delete for client UX). */
export async function deleteSupplier(tenantId, id) {
  const row = await setSupplierActive(tenantId, id, false)
  return Boolean(row)
}

export async function assertSupplierActive(tenantId, id) {
  const { rows } = await tenantQuery(
    tenantId,
    `
      SELECT id, is_active AS "isActive", company_name AS "companyName"
      FROM suppliers
      WHERE tenant_id = $1 AND id = $2
      LIMIT 1
    `,
    [id],
  )
  const row = rows[0]
  if (!row) {
    const error = new Error('Supplier not found')
    error.status = 404
    throw error
  }
  if (!row.isActive) {
    const error = new Error('Supplier is inactive and cannot be used for new orders')
    error.status = 409
    throw error
  }
  return row
}
