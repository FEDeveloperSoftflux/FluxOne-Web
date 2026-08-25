import { tenantQuery } from '../../../config/db.js'

function dateParams({ from, to } = {}) {
  return [from || null, to || null]
}

export async function inventoryReport(tenantId, { from, to } = {}) {
  const { rows: summaryRows } = await tenantQuery(
    tenantId,
    `
      SELECT
        count(*)::int AS "totalProducts",
        COALESCE(sum(p.quantity), 0)::numeric AS "totalQuantity",
        COALESCE(sum(p.quantity * p.purchase_price), 0)::numeric AS "totalPurchaseValue",
        COALESCE(sum(p.quantity * p.selling_price), 0)::numeric AS "totalSellingValue"
      FROM products p
      WHERE p.tenant_id = $1
        AND ($2::date IS NULL OR p.created_at::date >= $2::date)
        AND ($3::date IS NULL OR p.created_at::date <= $3::date)
    `,
    dateParams({ from, to }),
  )

  const { rows: items } = await tenantQuery(
    tenantId,
    `
      SELECT
        p.id,
        p.name,
        p.item_code AS "itemCode",
        p.barcode,
        p.type,
        p.scale,
        p.quantity,
        p.status,
        p.purchase_price AS "purchasePrice",
        p.selling_price AS "sellingPrice",
        c.name AS "categoryName",
        sc.name AS "subcategoryName"
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id AND c.tenant_id = p.tenant_id
      LEFT JOIN categories sc ON sc.id = p.subcategory_id AND sc.tenant_id = p.tenant_id
      WHERE p.tenant_id = $1
        AND ($2::date IS NULL OR p.created_at::date >= $2::date)
        AND ($3::date IS NULL OR p.created_at::date <= $3::date)
      ORDER BY p.name
    `,
    dateParams({ from, to }),
  )

  return { summary: summaryRows[0], items }
}

export async function stockMovementReport(tenantId, { from, to } = {}) {
  const { rows: summary } = await tenantQuery(
    tenantId,
    `
      SELECT
        l.movement_type AS "movementType",
        count(*)::int AS "eventCount",
        COALESCE(sum(l.quantity), 0)::numeric AS "totalQuantity"
      FROM inventory_ledger l
      WHERE l.tenant_id = $1
        AND ($2::date IS NULL OR l.created_at::date >= $2::date)
        AND ($3::date IS NULL OR l.created_at::date <= $3::date)
      GROUP BY l.movement_type
      ORDER BY l.movement_type
    `,
    dateParams({ from, to }),
  )

  const { rows: movements } = await tenantQuery(
    tenantId,
    `
      SELECT
        l.id,
        l.movement_type AS "movementType",
        l.quantity,
        l.scale,
        l.reason,
        l.created_at AS "createdAt",
        p.name AS "productName",
        p.item_code AS "itemCode",
        fb.name AS "fromBranchName",
        tb.name AS "toBranchName",
        s.company_name AS "companyName"
      FROM inventory_ledger l
      JOIN products p ON p.id = l.product_id AND p.tenant_id = l.tenant_id
      LEFT JOIN branches fb ON fb.id = l.from_branch_id AND fb.tenant_id = l.tenant_id
      LEFT JOIN branches tb ON tb.id = l.to_branch_id AND tb.tenant_id = l.tenant_id
      LEFT JOIN suppliers s ON s.id = l.supplier_id AND s.tenant_id = l.tenant_id
      WHERE l.tenant_id = $1
        AND ($2::date IS NULL OR l.created_at::date >= $2::date)
        AND ($3::date IS NULL OR l.created_at::date <= $3::date)
      ORDER BY l.created_at DESC
    `,
    dateParams({ from, to }),
  )

  return { summary, movements }
}

export async function purchaseReport(tenantId, { from, to } = {}) {
  const { rows: summaryRows } = await tenantQuery(
    tenantId,
    `
      SELECT
        count(DISTINCT po.id)::int AS "totalOrders",
        COALESCE(sum(poi.quantity * poi.unit_cost), 0)::numeric AS "totalSpend",
        count(DISTINCT po.supplier_id)::int AS "supplierCount"
      FROM purchase_orders po
      LEFT JOIN purchase_order_items poi
        ON poi.purchase_order_id = po.id AND poi.tenant_id = po.tenant_id
      WHERE po.tenant_id = $1
        AND ($2::date IS NULL OR po.created_at::date >= $2::date)
        AND ($3::date IS NULL OR po.created_at::date <= $3::date)
    `,
    dateParams({ from, to }),
  )

  const { rows: orders } = await tenantQuery(
    tenantId,
    `
      SELECT
        po.id,
        po.order_number AS "orderNumber",
        po.status,
        po.created_at AS "createdAt",
        s.company_name AS "companyName",
        count(poi.id)::int AS "itemsNumber",
        COALESCE(sum(poi.quantity * poi.unit_cost), 0)::numeric AS "orderTotal"
      FROM purchase_orders po
      JOIN suppliers s ON s.id = po.supplier_id AND s.tenant_id = po.tenant_id
      LEFT JOIN purchase_order_items poi
        ON poi.purchase_order_id = po.id AND poi.tenant_id = po.tenant_id
      WHERE po.tenant_id = $1
        AND ($2::date IS NULL OR po.created_at::date >= $2::date)
        AND ($3::date IS NULL OR po.created_at::date <= $3::date)
      GROUP BY po.id, s.company_name
      ORDER BY po.created_at DESC
    `,
    dateParams({ from, to }),
  )

  return { summary: summaryRows[0], orders }
}

export async function lowStockReport(tenantId) {
  const { rows } = await tenantQuery(
    tenantId,
    `
      SELECT
        p.id,
        p.name,
        p.item_code AS "itemCode",
        p.scale,
        p.quantity,
        p.reorder_point AS "reorderPoint",
        CASE
          WHEN p.quantity <= 0 THEN 'red'
          WHEN p.quantity <= p.reorder_point THEN 'yellow'
          ELSE 'green'
        END AS status,
        c.name AS "categoryName"
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id AND c.tenant_id = p.tenant_id
      WHERE p.tenant_id = $1
        AND p.quantity <= p.reorder_point
      ORDER BY p.quantity ASC, p.name
    `,
  )
  return { items: rows, count: rows.length }
}
