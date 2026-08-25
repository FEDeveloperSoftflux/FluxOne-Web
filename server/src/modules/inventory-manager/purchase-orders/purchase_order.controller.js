import {
  approvePurchaseOrder,
  buildPurchaseOrderPrint,
  cancelPurchaseOrder,
  generatePurchaseOrder,
  getPurchaseOrderById,
  listPurchaseOrders,
  priceHistory,
  sendPurchaseOrderSms,
} from './purchase_order.model.js'
import { fail, success } from '../../../utils/response.util.js'
import { paginatedResult } from '../../../utils/pagination.util.js'

export async function list(req, res) {
  const result = await listPurchaseOrders(req.tenantId, req.validated.query)
  return success(res, paginatedResult(result.items, result))
}

export async function generate(req, res) {
  const order = await generatePurchaseOrder(req.tenantId, {
    ...req.validated.body,
    createdBy: req.user.id,
  })

  let sms = null
  if (req.validated.body.sendSms) {
    try {
      sms = await sendPurchaseOrderSms(req.tenantId, order.id)
    } catch (err) {
      sms = { sent: false, error: err.message || 'Failed to send SMS' }
    }
  }

  return success(res, { ...order, sms }, 201)
}

export async function detail(req, res) {
  const order = await getPurchaseOrderById(req.tenantId, req.validated.params.id)
  if (!order) return fail(res, 'Purchase order not found', 404)
  return success(res, order)
}

export async function history(req, res) {
  const data = await priceHistory(req.tenantId, req.validated.params.id)
  if (!data) return fail(res, 'Purchase order not found', 404)
  return success(res, data)
}

export async function cancel(req, res) {
  const order = await cancelPurchaseOrder(req.tenantId, req.validated.params.id)
  if (!order) return fail(res, 'Purchase order not found', 404)
  return success(res, order)
}

export async function approve(req, res) {
  const order = await approvePurchaseOrder(req.tenantId, req.validated.params.id, req.user.id)
  if (!order) return fail(res, 'Purchase order not found', 404)
  return success(res, order)
}

export async function print(req, res) {
  const data = await buildPurchaseOrderPrint(req.tenantId, req.validated.params.id)
  if (!data) return fail(res, 'Purchase order not found', 404)

  if (req.query.format === 'json') {
    return success(res, data)
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  return res.send(data.html)
}

export async function sendSmsToSupplier(req, res) {
  const result = await sendPurchaseOrderSms(req.tenantId, req.validated.params.id)
  if (!result) return fail(res, 'Purchase order not found', 404)
  return success(res, result)
}
