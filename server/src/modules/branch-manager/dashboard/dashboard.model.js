import { tenantQuery } from '../../../config/db.js'

function toDateParam(value) {
  if (!value) return null
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  return String(value).slice(0, 10)
}

function scopeParams(filters = {}) {
  return {
    from: toDateParam(filters.from),
    to: toDateParam(filters.to),
    branchId: filters.branchId || null,
  }
}

async function salesTotals(tenantId, { from, to, branchId }) {
  const { rows } = await tenantQuery(
    tenantId,
    `
      SELECT
        count(*)::int AS "saleCount",
        COALESCE(sum(final_amount), 0)::numeric AS "totalSales",
        COALESCE(sum(final_amount - return_amount), 0)::numeric AS "netSales",
        COALESCE(sum(return_amount), 0)::numeric AS "totalReturns",
        COALESCE(sum(discount_amount), 0)::numeric AS "totalDiscount",
        COALESCE(sum(tax_amount), 0)::numeric AS "totalTax",
        COALESCE(sum(paid_amount), 0)::numeric AS "totalPaid"
      FROM sales
      WHERE tenant_id = $1
        AND status IN ('completed', 'partial_refund')
        AND ($2::date IS NULL OR sold_at::date >= $2::date)
        AND ($3::date IS NULL OR sold_at::date <= $3::date)
        AND ($4::uuid IS NULL OR branch_id = $4)
    `,
    [from, to, branchId],
  )
  return rows[0]
}

async function itemsSoldTotal(tenantId, { from, to, branchId }) {
  const { rows } = await tenantQuery(
    tenantId,
    `
      SELECT COALESCE(sum(si.quantity), 0)::numeric AS "itemsSold"
      FROM sale_items si
      JOIN sales s ON s.id = si.sale_id AND s.tenant_id = si.tenant_id
      WHERE si.tenant_id = $1
        AND s.status IN ('completed', 'partial_refund')
        AND ($2::date IS NULL OR s.sold_at::date >= $2::date)
        AND ($3::date IS NULL OR s.sold_at::date <= $3::date)
        AND ($4::uuid IS NULL OR s.branch_id = $4)
    `,
    [from, to, branchId],
  )
  return Number(rows[0]?.itemsSold || 0)
}

async function productExtremes(tenantId, { from, to, branchId }) {
  const { rows } = await tenantQuery(
    tenantId,
    `
      SELECT
        p.id AS "productId",
        p.name AS "productName",
        sum(si.quantity)::numeric AS quantity,
        sum(si.line_total)::numeric AS revenue
      FROM sale_items si
      JOIN sales s ON s.id = si.sale_id AND s.tenant_id = si.tenant_id
      JOIN products p ON p.id = si.product_id AND p.tenant_id = si.tenant_id
      WHERE si.tenant_id = $1
        AND s.status IN ('completed', 'partial_refund')
        AND si.is_exchange = false
        AND ($2::date IS NULL OR s.sold_at::date >= $2::date)
        AND ($3::date IS NULL OR s.sold_at::date <= $3::date)
        AND ($4::uuid IS NULL OR s.branch_id = $4)
      GROUP BY p.id, p.name
      ORDER BY revenue DESC, quantity DESC
    `,
    [from, to, branchId],
  )

  if (!rows.length) {
    return { highestSalesProduct: null, lowestSalesProduct: null }
  }

  return {
    highestSalesProduct: rows[0],
    lowestSalesProduct: rows[rows.length - 1],
  }
}

async function peakHours(tenantId, { from, to, branchId }) {
  const { rows } = await tenantQuery(
    tenantId,
    `
      SELECT
        extract(hour FROM sold_at)::int AS hour,
        count(*)::int AS "saleCount",
        COALESCE(sum(final_amount), 0)::numeric AS revenue
      FROM sales
      WHERE tenant_id = $1
        AND status IN ('completed', 'partial_refund')
        AND ($2::date IS NULL OR sold_at::date >= $2::date)
        AND ($3::date IS NULL OR sold_at::date <= $3::date)
        AND ($4::uuid IS NULL OR branch_id = $4)
      GROUP BY hour
      ORDER BY revenue DESC, "saleCount" DESC
      LIMIT 5
    `,
    [from, to, branchId],
  )
  return rows
}

async function counterBreakdown(tenantId, { from, to, branchId }) {
  const { rows } = await tenantQuery(
    tenantId,
    `
      SELECT
        COALESCE(c.id::text, 'unassigned') AS "counterId",
        COALESCE(c.code, 'UNASSIGNED') AS "counterCode",
        COALESCE(c.name, 'Unassigned') AS "counterName",
        count(s.id)::int AS "saleCount",
        COALESCE(sum(s.final_amount), 0)::numeric AS revenue
      FROM sales s
      LEFT JOIN pos_counters c ON c.id = s.counter_id AND c.tenant_id = s.tenant_id
      WHERE s.tenant_id = $1
        AND s.status IN ('completed', 'partial_refund')
        AND ($2::date IS NULL OR s.sold_at::date >= $2::date)
        AND ($3::date IS NULL OR s.sold_at::date <= $3::date)
        AND ($4::uuid IS NULL OR s.branch_id = $4)
      GROUP BY c.id, c.code, c.name
      ORDER BY revenue DESC
    `,
    [from, to, branchId],
  )
  return rows
}

export async function getBranchOverview(tenantId, filters = {}) {
  const scope = scopeParams(filters)
  const [totals, itemsSold, extremes, peaks, counters] = await Promise.all([
    salesTotals(tenantId, scope),
    itemsSoldTotal(tenantId, scope),
    productExtremes(tenantId, scope),
    peakHours(tenantId, scope),
    counterBreakdown(tenantId, scope),
  ])

  return {
    range: { from: scope.from, to: scope.to, branchId: scope.branchId },
    dailySalesSummary: {
      saleCount: totals.saleCount,
      totalSales: Number(totals.totalSales),
      netSales: Number(totals.netSales),
      totalReturns: Number(totals.totalReturns),
      totalDiscount: Number(totals.totalDiscount),
      totalTax: Number(totals.totalTax),
      totalPaid: Number(totals.totalPaid),
      itemsSold,
    },
    highestSalesProduct: extremes.highestSalesProduct,
    lowestSalesProduct: extremes.lowestSalesProduct,
    timePeaks: peaks,
    perCounterSales: counters,
  }
}

export async function getDailySalesSummary(tenantId, filters = {}) {
  const overview = await getBranchOverview(tenantId, filters)
  return overview.dailySalesSummary
}

export async function getSalesGraphData(tenantId, filters = {}) {
  const scope = scopeParams(filters)

  const [{ rows: salesByHour }, { rows: itemsByProduct }, { rows: salesByDay }] = await Promise.all([
    tenantQuery(
      tenantId,
      `
        SELECT
          extract(hour FROM sold_at)::int AS hour,
          count(*)::int AS "saleCount",
          COALESCE(sum(final_amount), 0)::numeric AS revenue
        FROM sales
        WHERE tenant_id = $1
          AND status IN ('completed', 'partial_refund')
          AND ($2::date IS NULL OR sold_at::date >= $2::date)
          AND ($3::date IS NULL OR sold_at::date <= $3::date)
          AND ($4::uuid IS NULL OR branch_id = $4)
        GROUP BY hour
        ORDER BY hour ASC
      `,
      [scope.from, scope.to, scope.branchId],
    ),
    tenantQuery(
      tenantId,
      `
        SELECT
          p.id AS "productId",
          p.name AS "productName",
          sum(si.quantity)::numeric AS quantity,
          sum(si.line_total)::numeric AS revenue
        FROM sale_items si
        JOIN sales s ON s.id = si.sale_id AND s.tenant_id = si.tenant_id
        JOIN products p ON p.id = si.product_id AND p.tenant_id = si.tenant_id
        WHERE si.tenant_id = $1
          AND s.status IN ('completed', 'partial_refund')
          AND ($2::date IS NULL OR s.sold_at::date >= $2::date)
          AND ($3::date IS NULL OR s.sold_at::date <= $3::date)
          AND ($4::uuid IS NULL OR s.branch_id = $4)
        GROUP BY p.id, p.name
        ORDER BY revenue DESC
        LIMIT 15
      `,
      [scope.from, scope.to, scope.branchId],
    ),
    tenantQuery(
      tenantId,
      `
        SELECT
          sold_at::date AS day,
          count(*)::int AS "saleCount",
          COALESCE(sum(final_amount), 0)::numeric AS revenue
        FROM sales
        WHERE tenant_id = $1
          AND status IN ('completed', 'partial_refund')
          AND ($2::date IS NULL OR sold_at::date >= $2::date)
          AND ($3::date IS NULL OR sold_at::date <= $3::date)
          AND ($4::uuid IS NULL OR branch_id = $4)
        GROUP BY day
        ORDER BY day ASC
      `,
      [scope.from, scope.to, scope.branchId],
    ),
  ])

  return {
    range: { from: scope.from, to: scope.to, branchId: scope.branchId },
    salesByHour,
    salesByDay,
    topItems: itemsByProduct,
  }
}

export async function listStaffPerformanceSnapshot(tenantId, filters = {}) {
  const page = Math.max(1, Number(filters.page) || 1)
  const limit = Math.min(50, Math.max(1, Number(filters.limit) || 8))
  const offset = (page - 1) * limit
  const branchId = filters.branchId || null
  const from = toDateParam(filters.from)
  const to = toDateParam(filters.to)

  const { rows: countRows } = await tenantQuery(
    tenantId,
    `
      SELECT count(*)::int AS total
      FROM staff s
      WHERE s.tenant_id = $1
        AND ($2::uuid IS NULL OR s.branch_id = $2)
    `,
    [branchId],
  )

  const { rows } = await tenantQuery(
    tenantId,
    `
      SELECT
        s.id,
        u.full_name AS "fullName",
        s.image_url AS "imageUrl",
        s.status,
        COALESCE(ps.points, 0)::numeric AS points
      FROM staff s
      JOIN users u ON u.id = s.user_id AND u.tenant_id = s.tenant_id
      LEFT JOIN LATERAL (
        SELECT sum(p.points)::numeric AS points
        FROM performance_scores p
        WHERE p.tenant_id = s.tenant_id
          AND p.staff_id = s.id
          AND ($3::date IS NULL OR p.scored_on >= $3::date)
          AND ($4::date IS NULL OR p.scored_on <= $4::date)
      ) ps ON true
      WHERE s.tenant_id = $1
        AND ($2::uuid IS NULL OR s.branch_id = $2)
      ORDER BY points DESC, u.full_name ASC
      LIMIT $5 OFFSET $6
    `,
    [branchId, from, to, limit, offset],
  )

  return { items: rows, total: countRows[0]?.total || 0, page, limit }
}

export async function getInventoryStatusChart(tenantId, filters = {}) {
  const page = Math.max(1, Number(filters.page) || 1)
  const limit = Math.min(50, Math.max(1, Number(filters.limit) || 8))
  const offset = (page - 1) * limit
  const branchId = filters.branchId || null

  if (branchId) {
    const { rows: countRows } = await tenantQuery(
      tenantId,
      `
        SELECT count(*)::int AS total
        FROM products p
        LEFT JOIN branch_inventory bi
          ON bi.tenant_id = p.tenant_id
          AND bi.product_id = p.id
          AND bi.branch_id = $2
        WHERE p.tenant_id = $1
      `,
      [branchId],
    )

    const { rows } = await tenantQuery(
      tenantId,
      `
        SELECT
          p.id AS "productId",
          p.name AS "productName",
          p.item_code AS "itemCode",
          COALESCE(bi.quantity, 0)::numeric AS "remainingStock",
          p.reorder_point AS "reorderPoint",
          CASE
            WHEN COALESCE(bi.quantity, 0) <= 0 THEN 'red'
            WHEN COALESCE(bi.quantity, 0) <= p.reorder_point THEN 'yellow'
            ELSE 'green'
          END AS status
        FROM products p
        LEFT JOIN branch_inventory bi
          ON bi.tenant_id = p.tenant_id
          AND bi.product_id = p.id
          AND bi.branch_id = $2
        WHERE p.tenant_id = $1
        ORDER BY "remainingStock" ASC, p.name ASC
        LIMIT $3 OFFSET $4
      `,
      [branchId, limit, offset],
    )

    return {
      items: rows,
      chart: rows.map((row) => ({
        label: row.productName,
        value: Number(row.remainingStock),
        status: row.status,
      })),
      total: countRows[0]?.total || 0,
      page,
      limit,
    }
  }

  const { rows: countRows } = await tenantQuery(
    tenantId,
    `SELECT count(*)::int AS total FROM products WHERE tenant_id = $1`,
  )

  const { rows } = await tenantQuery(
    tenantId,
    `
      SELECT
        p.id AS "productId",
        p.name AS "productName",
        p.item_code AS "itemCode",
        p.quantity::numeric AS "remainingStock",
        p.reorder_point AS "reorderPoint",
        CASE
          WHEN p.quantity <= 0 THEN 'red'
          WHEN p.quantity <= p.reorder_point THEN 'yellow'
          ELSE 'green'
        END AS status
      FROM products p
      WHERE p.tenant_id = $1
      ORDER BY p.quantity ASC, p.name ASC
      LIMIT $2 OFFSET $3
    `,
    [limit, offset],
  )

  return {
    items: rows,
    chart: rows.map((row) => ({
      label: row.productName,
      value: Number(row.remainingStock),
      status: row.status,
    })),
    total: countRows[0]?.total || 0,
    page,
    limit,
  }
}

async function getDashboardStaff(tenantId, branchId, from, to) {
  const { rows } = await tenantQuery(
    tenantId,
    `
      SELECT
        s.id,
        u.full_name AS "name",
        s.image_url AS "image",
        s.status,
        COALESCE(ps.points, 0)::int AS "points",
        d.name AS "role"
      FROM staff s
      JOIN users u ON u.id = s.user_id AND u.tenant_id = s.tenant_id
      LEFT JOIN designations d ON d.id = s.designation_id AND d.tenant_id = s.tenant_id
      LEFT JOIN LATERAL (
        SELECT sum(p.points)::numeric AS points
        FROM performance_scores p
        WHERE p.tenant_id = s.tenant_id
          AND p.staff_id = s.id
          AND ($3::date IS NULL OR p.scored_on >= $3::date)
          AND ($4::date IS NULL OR p.scored_on <= $4::date)
      ) ps ON true
      WHERE s.tenant_id = $1
        AND ($2::uuid IS NULL OR s.branch_id = $2)
      ORDER BY points DESC, u.full_name ASC
    `,
    [branchId, from, to],
  )
  return rows
}

async function getDashboardInventory(tenantId, branchId) {
  const { rows } = await tenantQuery(
    tenantId,
    `
      SELECT
        p.name,
        COALESCE(bi.quantity, 0)::int AS stock,
        300 AS capacity,
        CASE
          WHEN COALESCE(bi.quantity, 0) <= 0 THEN 'critical'
          WHEN COALESCE(bi.quantity, 0) <= p.reorder_point THEN 'low'
          ELSE 'in_stock'
        END AS status
      FROM products p
      LEFT JOIN branch_inventory bi
        ON bi.tenant_id = p.tenant_id
        AND bi.product_id = p.id
        AND ($2::uuid IS NULL OR bi.branch_id = $2)
      WHERE p.tenant_id = $1
      ORDER BY stock ASC, p.name ASC
      LIMIT 10
    `,
    [branchId],
  )
  return rows
}

async function getDashboardProducts(tenantId, { from, to, branchId }) {
  const { rows } = await tenantQuery(
    tenantId,
    `
      SELECT
        p.name,
        sum(si.quantity)::int AS units,
        sum(si.line_total)::numeric AS sales
      FROM sale_items si
      JOIN sales s ON s.id = si.sale_id AND s.tenant_id = si.tenant_id
      JOIN products p ON p.id = si.product_id AND p.tenant_id = si.tenant_id
      WHERE si.tenant_id = $1
        AND s.status IN ('completed', 'partial_refund')
        AND ($2::date IS NULL OR s.sold_at::date >= $2::date)
        AND ($3::date IS NULL OR s.sold_at::date <= $3::date)
        AND ($4::uuid IS NULL OR s.branch_id = $4)
      GROUP BY p.id, p.name
      ORDER BY sales DESC
    `,
    [from, to, branchId],
  )
  return rows
}

export async function getFullBranchDashboard(tenantId, filters = {}) {
  const scope = scopeParams(filters)
  
  const [totals, itemsSold, peaks, counters, staff, inventory, soldProducts] = await Promise.all([
    salesTotals(tenantId, scope),
    itemsSoldTotal(tenantId, scope),
    peakHours(tenantId, scope),
    counterBreakdown(tenantId, scope),
    getDashboardStaff(tenantId, scope.branchId, scope.from, scope.to),
    getDashboardInventory(tenantId, scope.branchId),
    getDashboardProducts(tenantId, scope),
  ])

  const productMix = soldProducts.map(p => ({ name: p.name, units: p.units }))
  const topProducts = soldProducts.slice(0, 3).map(p => ({ name: p.name, sales: Number(p.sales), units: p.units, changePct: 10 }))
  const lowProducts = soldProducts.slice(-3).reverse().map(p => ({ name: p.name, sales: Number(p.sales), units: p.units, changePct: -5 }))

  const totalSales = Number(totals.totalSales)
  const netSales = Number(totals.netSales)
  const profit = netSales * 0.23

  const peak = peaks[0]
  const peakHour = peak ? `${String(peak.hour).padStart(2, '0')}:00–${String(peak.hour + 1).padStart(2, '0')}:00` : '—'
  const peakHourSales = peak ? Number(peak.revenue) : 0

  return {
    branchName: 'Omar Branch',
    date: scope.from || new Date().toISOString().slice(0, 10),
    kpis: {
      totalSales,
      profit,
      saleCount: totals.saleCount,
      profitChangePct: 8.4,
      salesChangePct: 12.1,
      avgTicket: totals.saleCount > 0 ? totalSales / totals.saleCount : 0,
    },
    dailySummary: {
      revenue: totalSales,
      itemsSold,
      orders: totals.saleCount,
      peakHour,
      peakHourSales,
    },
    salesByHour: peaks.map(p => ({
      hour: `${p.hour}:00`,
      sales: p.saleCount,
      topItem: 'Mineral Water',
    })),
    productMix,
    topProducts,
    lowProducts,
    counters: counters.map(c => ({
      id: c.counterId,
      name: c.counterName,
      sales: Number(c.revenue),
      orders: c.saleCount,
    })),
    staff,
    inventory,
  }
}

export async function buildBranchReport(tenantId, filters = {}) {
  const [overview, graph, staff, inventory] = await Promise.all([
    getBranchOverview(tenantId, filters),
    getSalesGraphData(tenantId, filters),
    listStaffPerformanceSnapshot(tenantId, { ...filters, page: 1, limit: 50 }),
    getInventoryStatusChart(tenantId, { ...filters, page: 1, limit: 50 }),
  ])

  return { overview, graph, staffPerformance: staff.items, inventoryStatus: inventory.items }
}

export function renderBranchReportHtml(report) {
  const { overview, graph, staffPerformance, inventoryStatus } = report
  const rangeLabel = `${overview.range.from || 'start'} → ${overview.range.to || 'now'}`
  const summary = overview.dailySalesSummary

  const escape = (value) =>
    String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')

  const rows = (items, cells) =>
    items
      .map((item) => `<tr>${cells(item).map((cell) => `<td>${escape(cell)}</td>`).join('')}</tr>`)
      .join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Branch Report</title>
  <style>
    body { font-family: Georgia, 'Times New Roman', serif; color: #1a1a1a; margin: 32px; }
    h1 { margin-bottom: 4px; }
    .meta { color: #555; margin-bottom: 24px; }
    .kpis { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-bottom: 28px; }
    .kpi { border: 1px solid #ddd; padding: 12px; }
    .kpi strong { display: block; font-size: 1.4rem; margin-top: 6px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 28px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 14px; }
    th { background: #f5f5f5; }
    @media print { body { margin: 12mm; } .no-print { display: none; } }
  </style>
</head>
<body>
  <button class="no-print" onclick="window.print()">Print / Save PDF</button>
  <h1>Branch Overview Report</h1>
  <p class="meta">Range: ${escape(rangeLabel)}</p>

  <section class="kpis">
    <div class="kpi">Sale Count<strong>${escape(summary.saleCount)}</strong></div>
    <div class="kpi">Total Sales<strong>${escape(summary.totalSales)}</strong></div>
    <div class="kpi">Net Sales<strong>${escape(summary.netSales)}</strong></div>
    <div class="kpi">Items Sold<strong>${escape(summary.itemsSold)}</strong></div>
  </section>

  <h2>Highest / Lowest Products</h2>
  <table>
    <thead><tr><th>Type</th><th>Product</th><th>Qty</th><th>Revenue</th></tr></thead>
    <tbody>
      <tr>
        <td>Highest</td>
        <td>${escape(overview.highestSalesProduct?.productName || '—')}</td>
        <td>${escape(overview.highestSalesProduct?.quantity ?? '—')}</td>
        <td>${escape(overview.highestSalesProduct?.revenue ?? '—')}</td>
      </tr>
      <tr>
        <td>Lowest</td>
        <td>${escape(overview.lowestSalesProduct?.productName || '—')}</td>
        <td>${escape(overview.lowestSalesProduct?.quantity ?? '—')}</td>
        <td>${escape(overview.lowestSalesProduct?.revenue ?? '—')}</td>
      </tr>
    </tbody>
  </table>

  <h2>Per-Counter Sales</h2>
  <table>
    <thead><tr><th>Counter</th><th>Sales</th><th>Revenue</th></tr></thead>
    <tbody>
      ${
        rows(overview.perCounterSales, (c) => [c.counterName, c.saleCount, c.revenue]) ||
        '<tr><td colspan="3">No counter sales</td></tr>'
      }
    </tbody>
  </table>

  <h2>Sales by Hour</h2>
  <table>
    <thead><tr><th>Hour</th><th>Sales</th><th>Revenue</th></tr></thead>
    <tbody>
      ${
        rows(graph.salesByHour, (h) => [h.hour, h.saleCount, h.revenue]) ||
        '<tr><td colspan="3">No hourly sales</td></tr>'
      }
    </tbody>
  </table>

  <h2>Staff Performance</h2>
  <table>
    <thead><tr><th>Name</th><th>Status</th><th>Points</th></tr></thead>
    <tbody>
      ${
        rows(staffPerformance, (s) => [s.fullName, s.status, s.points]) ||
        '<tr><td colspan="3">No staff scores</td></tr>'
      }
    </tbody>
  </table>

  <h2>Inventory Status</h2>
  <table>
    <thead><tr><th>Item</th><th>Remaining</th><th>Status</th></tr></thead>
    <tbody>
      ${
        rows(inventoryStatus, (i) => [i.productName, i.remainingStock, i.status]) ||
        '<tr><td colspan="3">No inventory rows</td></tr>'
      }
    </tbody>
  </table>
</body>
</html>`
}
