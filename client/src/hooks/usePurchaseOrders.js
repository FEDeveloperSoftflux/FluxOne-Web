import { useCallback, useEffect, useRef, useState } from 'react'
import { apiClient } from '@/api/api'
import { endpoints } from '@/api/endpoints'
import { mapPurchaseHistory, mapPurchaseOrder } from '@/lib/mapPurchaseOrder'
import { mapSupplier } from '@/lib/mapSupplier'
import { mapProduct } from '@/lib/mapProduct'
import { downloadPurchaseOrderPdf } from '@/lib/pdfDownload'

export const ORDERS_PAGE_SIZE = 8

/**
 * Live purchase orders: list, generate, detail, history, print, approve/cancel.
 */
export function usePurchaseOrders(initialFilters = {}) {
  const [items, setItems] = useState([])
  const [pagination, setPagination] = useState({
    page: 1,
    limit: ORDERS_PAGE_SIZE,
    total: 0,
    pageCount: 1,
  })
  const [filters, setFilters] = useState({
    q: '',
    supplierId: '',
    status: '',
    page: 1,
    limit: ORDERS_PAGE_SIZE,
    ...initialFilters,
  })
  const [loading, setLoading] = useState(true)
  const [mutating, setMutating] = useState(false)
  const [error, setError] = useState(null)
  const [selected, setSelected] = useState(null)
  const [history, setHistory] = useState(null)
  const [supplierOptions, setSupplierOptions] = useState([])
  const [productOptions, setProductOptions] = useState([])
  const filtersRef = useRef(filters)
  filtersRef.current = filters

  const reload = useCallback(async (next = filtersRef.current) => {
    setLoading(true)
    setError(null)
    try {
      const result = await apiClient.get(endpoints.orders.list, {
        page: next.page || 1,
        limit: next.limit || ORDERS_PAGE_SIZE,
        q: next.q || undefined,
        supplierId: next.supplierId || undefined,
        status: next.status || undefined,
      })
      if (!result.success) {
        setItems([])
        setError(result.error || 'Failed to load orders')
        return result
      }
      const data = result.data || {}
      const rows = Array.isArray(data.items) ? data.items : []
      setItems(rows.map(mapPurchaseOrder))
      setPagination(
        data.pagination || {
          page: next.page || 1,
          limit: next.limit || ORDERS_PAGE_SIZE,
          total: rows.length,
          pageCount: 1,
        },
      )
      return result
    } catch (err) {
      console.warn('[usePurchaseOrders] reload error', err)
      setItems([])
      setError(err?.message || 'Failed to load orders')
      return { success: false, error: err?.message }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    reload(filters)
  }, [filters, reload])

  const updateFilters = useCallback((patch) => {
    setFilters((prev) => {
      const next = { ...prev, ...patch }
      const resets =
        patch.q !== undefined ||
        patch.supplierId !== undefined ||
        patch.status !== undefined
      if (resets && patch.page === undefined) next.page = 1
      return next
    })
  }, [])

  /** Options for Generate Order dialog */
  const loadFormOptions = useCallback(async () => {
    const [supRes, prodCollected] = await Promise.all([
      apiClient.get(endpoints.suppliers.list, { page: 1, limit: 50, active: 'active' }),
      (async () => {
        const all = []
        let page = 1
        let pageCount = 1
        do {
          const result = await apiClient.get(endpoints.products.list, {
            type: 'single',
            status: 'active',
            page,
            limit: 50,
          })
          if (!result.success) break
          const data = result.data || {}
          const rows = Array.isArray(data.items) ? data.items : []
          all.push(...rows.map(mapProduct))
          pageCount = data.pagination?.pageCount || 1
          page += 1
        } while (page <= pageCount)
        return all
      })(),
    ])

    const suppliers =
      supRes.success && Array.isArray(supRes.data?.items)
        ? supRes.data.items.map(mapSupplier)
        : []
    setSupplierOptions(suppliers)
    setProductOptions(prodCollected)
    console.debug('[usePurchaseOrders] form options', {
      suppliers: suppliers.length,
      products: prodCollected.length,
    })
  }, [])

  const fetchDetail = useCallback(async (id) => {
    const result = await apiClient.get(endpoints.orders.detail(id))
    if (!result.success) return result
    const order = mapPurchaseOrder(result.data)
    setSelected(order)
    return { success: true, data: order }
  }, [])

  const fetchHistory = useCallback(async (id) => {
    const result = await apiClient.get(endpoints.orders.history(id))
    if (!result.success) return result
    const data = mapPurchaseHistory(result.data)
    setHistory(data)
    return { success: true, data }
  }, [])

  const generateOrder = useCallback(
    async (payload) => {
      setMutating(true)
      try {
        console.debug('[usePurchaseOrders] generate', {
          supplierId: payload.supplierId,
          lines: payload.lines?.length,
        })
        const result = await apiClient.post(endpoints.orders.create, {
          supplierId: payload.supplierId,
          explanation: payload.explanation || undefined,
          sendSms: false, // Phase 2
          lines: payload.lines,
        })
        if (!result.success) return result
        await reload({ ...filtersRef.current, page: 1 })
        setFilters((prev) => ({ ...prev, page: 1 }))
        return { success: true, data: mapPurchaseOrder(result.data) }
      } finally {
        setMutating(false)
      }
    },
    [reload],
  )

  const approveOrder = useCallback(
    async (id) => {
      setMutating(true)
      try {
        const result = await apiClient.post(endpoints.orders.approve(id))
        if (result.success) await reload(filtersRef.current)
        return result
      } finally {
        setMutating(false)
      }
    },
    [reload],
  )

  const cancelOrder = useCallback(
    async (id) => {
      setMutating(true)
      try {
        const result = await apiClient.post(endpoints.orders.cancel(id))
        if (result.success) {
          await reload(filtersRef.current)
          if (selected?.id === id) setSelected(null)
        }
        return result
      } finally {
        setMutating(false)
      }
    },
    [reload, selected?.id],
  )

  /** Download purchase order as PDF (no printer required). */
  const printOrder = useCallback(async (idOrOrder) => {
    try {
      let order = idOrOrder && typeof idOrOrder === 'object' ? idOrOrder : null
      const id = order?.id || idOrOrder
      if (!order?.lines?.length && id) {
        const result = await apiClient.get(endpoints.orders.detail(id))
        if (!result.success) {
          return { success: false, error: result.error || 'Failed to load order for PDF' }
        }
        order = mapPurchaseOrder(result.data)
      }
      if (!order) return { success: false, error: 'Order not found' }
      downloadPurchaseOrderPdf(order)
      return { success: true, data: { downloaded: true } }
    } catch (err) {
      return { success: false, error: err?.message || 'PDF download failed' }
    }
  }, [])

  return {
    items,
    pagination,
    filters,
    loading,
    mutating,
    error,
    selected,
    history,
    supplierOptions,
    productOptions,
    updateFilters,
    setPage: (page) => updateFilters({ page }),
    loadFormOptions,
    fetchDetail,
    fetchHistory,
    clearDetail: () => {
      setSelected(null)
      setHistory(null)
    },
    generateOrder,
    approveOrder,
    cancelOrder,
    printOrder,
    reload: () => reload(filtersRef.current),
  }
}
