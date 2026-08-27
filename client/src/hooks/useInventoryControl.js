import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { apiClient } from '@/api/api'
import { endpoints } from '@/api/endpoints'
import { mapStockMovement, MOVEMENT_TYPES } from '@/lib/mapStockMovement'
import { mapPurchaseOrder } from '@/lib/mapPurchaseOrder'
import { mapProduct } from '@/lib/mapProduct'
import { mapSupplier } from '@/lib/mapSupplier'
import {
  getProductCatalog,
  peekProductCatalog,
} from '@/lib/productCatalogCache'

export const CONTROL_PAGE_SIZE = 8

const LIST_PATH = {
  [MOVEMENT_TYPES.IN]: endpoints.control.stockIn,
  [MOVEMENT_TYPES.OUT]: endpoints.control.stockOut,
  [MOVEMENT_TYPES.ADJUSTMENT]: endpoints.control.adjustments,
  [MOVEMENT_TYPES.DAMAGED]: endpoints.control.damaged,
  [MOVEMENT_TYPES.EXPIRED]: endpoints.control.expired,
}

const CREATE_PATH = {
  [MOVEMENT_TYPES.IN]: endpoints.control.stockIn,
  [MOVEMENT_TYPES.OUT]: endpoints.control.stockOut,
  [MOVEMENT_TYPES.ADJUSTMENT]: endpoints.control.adjustments,
  [MOVEMENT_TYPES.DAMAGED]: endpoints.control.damaged,
  [MOVEMENT_TYPES.EXPIRED]: endpoints.control.expired,
}

const ITEM_PATH = {
  [MOVEMENT_TYPES.ADJUSTMENT]: endpoints.control.adjustment,
  [MOVEMENT_TYPES.DAMAGED]: endpoints.control.damagedItem,
  [MOVEMENT_TYPES.EXPIRED]: endpoints.control.expiredItem,
}

/**
 * Live inventory control ledger for one movement type.
 * @param {string} movementType
 */
export function useInventoryControl(movementType, initialFilters = {}) {
  const [items, setItems] = useState([])
  const [pagination, setPagination] = useState({
    page: 1,
    limit: CONTROL_PAGE_SIZE,
    total: 0,
    pageCount: 1,
  })
  const [filters, setFilters] = useState({
    q: '',
    type: '',
    categoryId: '',
    subcategoryId: '',
    scale: '',
    page: 1,
    limit: CONTROL_PAGE_SIZE,
    ...initialFilters,
  })
  const [loading, setLoading] = useState(true)
  const [mutating, setMutating] = useState(false)
  const [error, setError] = useState(null)
  const [catalog, setCatalog] = useState(
    () =>
      peekProductCatalog() || {
        parents: [],
        childrenByParent: new Map(),
        all: [],
        taxes: [],
        offers: [],
      },
  )
  const [catalogLoading, setCatalogLoading] = useState(!peekProductCatalog())
  const filtersRef = useRef(filters)
  filtersRef.current = filters

  const listPath = LIST_PATH[movementType]

  const loadCatalog = useCallback(async ({ force = false } = {}) => {
    if (!force && peekProductCatalog()) {
      setCatalog(peekProductCatalog())
      setCatalogLoading(false)
    } else {
      setCatalogLoading(true)
    }
    try {
      const next = await getProductCatalog({ force })
      setCatalog(next)
      return next
    } finally {
      setCatalogLoading(false)
    }
  }, [])

  const reload = useCallback(
    async (next = filtersRef.current) => {
      if (!listPath) {
        setItems([])
        setLoading(false)
        return { success: false, error: 'Unknown movement type' }
      }
      setLoading(true)
      setError(null)
      try {
        const result = await apiClient.get(listPath, {
          page: next.page || 1,
          limit: next.limit || CONTROL_PAGE_SIZE,
          q: next.q || undefined,
          categoryId: next.categoryId || undefined,
          subcategoryId: next.subcategoryId || undefined,
          scale: next.scale || undefined,
          type: next.type || undefined,
        })
        if (!result.success) {
          setItems([])
          setError(result.error || 'Failed to load movements')
          return result
        }
        const data = result.data || {}
        const rows = Array.isArray(data.items) ? data.items : []
        setItems(rows.map(mapStockMovement))
        setPagination(
          data.pagination || {
            page: next.page || 1,
            limit: next.limit || CONTROL_PAGE_SIZE,
            total: rows.length,
            pageCount: 1,
          },
        )
        return result
      } catch (err) {
        console.warn('[useInventoryControl] reload error', err)
        setItems([])
        setError(err?.message || 'Failed to load movements')
        return { success: false, error: err?.message }
      } finally {
        setLoading(false)
      }
    },
    [listPath],
  )

  useEffect(() => {
    void loadCatalog()
  }, [loadCatalog])

  useEffect(() => {
    void reload(filters)
  }, [filters, reload])

  const updateFilters = useCallback((patch) => {
    setFilters((prev) => {
      const next = { ...prev, ...patch }
      const resets =
        patch.q !== undefined ||
        patch.categoryId !== undefined ||
        patch.subcategoryId !== undefined ||
        patch.scale !== undefined ||
        patch.type !== undefined
      if (resets && patch.page === undefined) next.page = 1
      return next
    })
  }, [])

  const setPage = useCallback((page) => {
    setFilters((prev) => ({ ...prev, page }))
  }, [])

  const selectedCategorySubs = useMemo(() => {
    if (!filters.categoryId) return []
    return catalog.childrenByParent?.get?.(filters.categoryId) || []
  }, [catalog, filters.categoryId])

  const createMovement = useCallback(
    async (body) => {
      const path = CREATE_PATH[movementType]
      if (!path) return { success: false, error: 'Unknown movement type' }
      setMutating(true)
      try {
        const result = await apiClient.post(path, body)
        if (result.success) await reload(filtersRef.current)
        return result
      } finally {
        setMutating(false)
      }
    },
    [movementType, reload],
  )

  const updateMovement = useCallback(
    async (id, body) => {
      const pathFn = ITEM_PATH[movementType]
      if (!pathFn) return { success: false, error: 'Edit not supported for this tab' }
      setMutating(true)
      try {
        const result = await apiClient.patch(pathFn(id), body)
        if (result.success) await reload(filtersRef.current)
        return result
      } finally {
        setMutating(false)
      }
    },
    [movementType, reload],
  )

  const deleteMovement = useCallback(
    async (id) => {
      const pathFn = ITEM_PATH[movementType]
      if (!pathFn) return { success: false, error: 'Delete not supported for this tab' }
      setMutating(true)
      try {
        const result = await apiClient.delete(pathFn(id))
        if (result.success) await reload(filtersRef.current)
        return result
      } finally {
        setMutating(false)
      }
    },
    [movementType, reload],
  )

  const stockInFromOrder = useCallback(
    async (purchaseOrderId) => {
      setMutating(true)
      try {
        const result = await apiClient.post(endpoints.control.stockInFromOrder, {
          purchaseOrderId,
        })
        if (result.success) await reload(filtersRef.current)
        return result
      } finally {
        setMutating(false)
      }
    },
    [reload],
  )

  return {
    movementType,
    items,
    pagination,
    filters,
    loading,
    mutating,
    error,
    catalog,
    catalogLoading,
    selectedCategorySubs,
    updateFilters,
    setPage,
    reload,
    loadCatalog,
    createMovement,
    updateMovement,
    deleteMovement,
    stockInFromOrder,
  }
}

/** Load product options for dialogs (live catalog products). */
export async function fetchControlProductOptions({
  categoryId,
  subcategoryId,
  q,
  limit = 50,
} = {}) {
  const result = await apiClient.get(endpoints.products.list, {
    page: 1,
    limit,
    categoryId: categoryId || undefined,
    subcategoryId: subcategoryId || undefined,
    q: q || undefined,
    status: 'active',
  })
  if (!result.success) return { success: false, error: result.error, items: [] }
  const rows = Array.isArray(result.data?.items) ? result.data.items : []
  return { success: true, items: rows.map(mapProduct) }
}

/** Load suppliers for optional company select. */
export async function fetchControlSuppliers() {
  const result = await apiClient.get(endpoints.suppliers.list, {
    page: 1,
    limit: 50,
    active: 'active',
  })
  if (!result.success) return { success: false, error: result.error, items: [] }
  const rows = Array.isArray(result.data?.items) ? result.data.items : []
  return { success: true, items: rows.map(mapSupplier) }
}

/** Approved POs for stock-in-from-order. */
export async function fetchApprovedPurchaseOrders() {
  const result = await apiClient.get(endpoints.orders.list, {
    page: 1,
    limit: 50,
    status: 'approved',
  })
  if (!result.success) return { success: false, error: result.error, items: [] }
  const rows = Array.isArray(result.data?.items) ? result.data.items : []
  return { success: true, items: rows.map(mapPurchaseOrder) }
}

export async function fetchPurchaseOrderDetail(id) {
  const result = await apiClient.get(endpoints.orders.detail(id))
  if (!result.success) return result
  return { success: true, data: mapPurchaseOrder(result.data) }
}

/** Employees for damaged-by select (`userId` → damagedByUserId). */
export async function fetchEmployeeLookups({ q } = {}) {
  const result = await apiClient.get(endpoints.lookups.employees, {
    page: 1,
    limit: 50,
    q: q || undefined,
  })
  if (!result.success) return { success: false, error: result.error, items: [] }
  const rows = Array.isArray(result.data?.items) ? result.data.items : []
  return {
    success: true,
    items: rows.map((row) => ({
      userId: row.userId,
      staffId: row.staffId,
      fullName: row.fullName || '',
      email: row.email || '',
      designation: row.designation || '',
    })),
  }
}
