import { tenantQuery } from '../../../config/db.js'

export async function getOverviewKpis(tenantId) {
  const { rows } = await tenantQuery(
    tenantId,
    `
      SELECT
        (SELECT count(*)::int FROM categories WHERE tenant_id = $1 AND parent_id IS NULL) AS "totalCategories",
        (SELECT count(*)::int FROM categories WHERE tenant_id = $1 AND parent_id IS NOT NULL) AS "totalSubCategories",
        (SELECT count(*)::int FROM products WHERE tenant_id = $1) AS "totalItems"
    `,
  )
  return rows[0]
}

export async function listStockAlerts(tenantId, { page = 1, limit = 8 } = {}) {
  const safePage = Math.max(1, Number(page) || 1)
  const safeLimit = Math.min(50, Math.max(1, Number(limit) || 8))
  const offset = (safePage - 1) * safeLimit

  const { rows } = await tenantQuery(
    tenantId,
    `
      SELECT
        id,
        name,
        "remainingNumber",
        status,
        source,
        count(*) OVER()::int AS "_total"
      FROM (
        SELECT
          p.id,
          p.name,
          p.quantity AS "remainingNumber",
          CASE
            WHEN p.quantity <= 0 THEN 'red'
            WHEN p.quantity <= p.reorder_point THEN 'yellow'
            ELSE 'green'
          END AS status,
          'system'::text AS source
        FROM products p
        WHERE p.tenant_id = $1

        UNION ALL

        SELECT
          sr.id,
          p.name,
          sr.remaining_quantity AS "remainingNumber",
          CASE
            WHEN sr.remaining_quantity <= 0 THEN 'red'
            WHEN sr.remaining_quantity <= p.reorder_point THEN 'yellow'
            ELSE 'green'
          END AS status,
          CASE WHEN sr.kind = 'request' THEN 'branch_request' ELSE 'branch_alert' END AS source
        FROM stock_requests sr
        JOIN products p ON p.id = sr.product_id AND p.tenant_id = sr.tenant_id
        WHERE sr.tenant_id = $1 AND sr.status = 'open'
      ) alerts
      ORDER BY "remainingNumber" ASC
      LIMIT $2 OFFSET $3
    `,
    [safeLimit, offset],
  )

  const total = rows[0]?._total || 0
  const items = rows.map(({ _total, ...item }) => item)
  return { items, total, page: safePage, limit: safeLimit }
}

export async function listStockOutGraph(tenantId, { from, to } = {}) {
  const { rows } = await tenantQuery(
    tenantId,
    `
      WITH TopItems AS (
        SELECT
          l.product_id
        FROM inventory_ledger l
        WHERE l.tenant_id = $1
          AND l.movement_type = 'out'
          AND ($2::date IS NULL OR l.created_at::date >= $2::date)
          AND ($3::date IS NULL OR l.created_at::date <= $3::date)
        GROUP BY l.product_id
        ORDER BY sum(l.quantity) DESC
        LIMIT 10
      )
      SELECT
        p.name,
        date_trunc('day', l.created_at)::date AS day,
        sum(l.quantity)::numeric AS quantity
      FROM inventory_ledger l
      JOIN TopItems ti ON ti.product_id = l.product_id
      JOIN products p ON p.id = l.product_id AND p.tenant_id = l.tenant_id
      WHERE l.tenant_id = $1
        AND l.movement_type = 'out'
        AND ($2::date IS NULL OR l.created_at::date >= $2::date)
        AND ($3::date IS NULL OR l.created_at::date <= $3::date)
      GROUP BY p.name, day
      ORDER BY day ASC
    `,
    [from || null, to || null],
  )
  return rows
}
