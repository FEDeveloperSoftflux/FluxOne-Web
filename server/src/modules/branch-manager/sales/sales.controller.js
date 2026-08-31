import { listSales, refundSale } from './sales.model.js'
import { success, fail } from '../../../utils/response.util.js'

export async function salesList(req, res) {
  try {
    const filters = {
      q: req.query.q,
      date: req.query.date,
      category_id: req.query.categoryId,
    }
    const rows = await listSales(req.tenantId, filters)

    // Calculate dynamic KPIs for the list response
    const totalSalesSum = rows.reduce((acc, r) => acc + parseFloat(r.finalAmount || 0), 0)
    const refundCount = rows.filter((r) => r.status === 'refunded').length
    const totalTransactions = rows.length

    return success(res, {
      items: rows,
      kpis: {
        totalSales: totalSalesSum,
        totalRefunds: refundCount,
        transactionCount: totalTransactions,
      },
    })
  } catch (err) {
    return fail(res, err.message || 'Failed to retrieve sales logs', 500)
  }
}

export async function processRefund(req, res) {
  const { id } = req.params
  try {
    const row = await refundSale(req.tenantId, id)
    if (!row) {
      return fail(res, 'Sale record not found or already refunded', 404)
    }
    return success(res, row)
  } catch (err) {
    return fail(res, err.message || 'Failed to process refund', 500)
  }
}
