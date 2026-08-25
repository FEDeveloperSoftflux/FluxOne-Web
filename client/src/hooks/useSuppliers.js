import { useCallback, useEffect, useRef, useState } from 'react'
import { apiClient } from '@/api/api'
import { endpoints } from '@/api/endpoints'
import { buildSupplierPayload, mapSupplier } from '@/lib/mapSupplier'

export const SUPPLIERS_PAGE_SIZE = 8

/**
 * Live supplier list + CRUD (tenant scoped via JWT).
 */
export function useSuppliers(initialFilters = {}) {
  const [items, setItems] = useState([])
  const [pagination, setPagination] = useState({
    page: 1,
    limit: SUPPLIERS_PAGE_SIZE,
    total: 0,
    pageCount: 1,
  })
  const [filters, setFilters] = useState({
    q: '',
    active: 'active',
    page: 1,
    limit: SUPPLIERS_PAGE_SIZE,
    ...initialFilters,
  })
  const [loading, setLoading] = useState(true)
  const [mutating, setMutating] = useState(false)
  const [error, setError] = useState(null)
  const filtersRef = useRef(filters)
  filtersRef.current = filters

  const reload = useCallback(async (next = filtersRef.current) => {
    setLoading(true)
    setError(null)
    try {
      const result = await apiClient.get(endpoints.suppliers.list, {
        page: next.page || 1,
        limit: next.limit || SUPPLIERS_PAGE_SIZE,
        q: next.q || undefined,
        active: next.active || 'active',
      })
      if (!result.success) {
        setItems([])
        setError(result.error || 'Failed to load suppliers')
        return result
      }
      const data = result.data || {}
      const rows = Array.isArray(data.items) ? data.items : Array.isArray(data) ? data : []
      setItems(rows.map(mapSupplier))
      setPagination(
        data.pagination || {
          page: next.page || 1,
          limit: next.limit || SUPPLIERS_PAGE_SIZE,
          total: rows.length,
          pageCount: 1,
        },
      )
      return result
    } catch (err) {
      console.warn('[useSuppliers] reload error', err)
      setItems([])
      setError(err?.message || 'Failed to load suppliers')
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
      if (patch.q !== undefined && patch.page === undefined) next.page = 1
      return next
    })
  }, [])

  const createSupplier = useCallback(
    async (fields) => {
      setMutating(true)
      try {
        const body = buildSupplierPayload(fields)
        console.debug('[useSuppliers] create', {
          companyName: fields.companyName,
          hasImage: body instanceof FormData,
        })
        const result = await apiClient.post(endpoints.suppliers.create, body)
        if (result.success) await reload({ ...filtersRef.current, page: 1 })
        return result.success
          ? { success: true, data: mapSupplier(result.data) }
          : result
      } finally {
        setMutating(false)
      }
    },
    [reload],
  )

  const updateSupplier = useCallback(
    async (id, fields) => {
      setMutating(true)
      try {
        const body = buildSupplierPayload(fields)
        const result = await apiClient.patch(endpoints.suppliers.update(id), body)
        if (result.success) await reload(filtersRef.current)
        return result.success
          ? { success: true, data: mapSupplier(result.data) }
          : result
      } finally {
        setMutating(false)
      }
    },
    [reload],
  )

  const deleteSupplier = useCallback(
    async (id) => {
      setMutating(true)
      try {
        const result = await apiClient.delete(endpoints.suppliers.remove(id))
        if (result.success) await reload(filtersRef.current)
        return result
      } finally {
        setMutating(false)
      }
    },
    [reload],
  )

  const setSupplierActive = useCallback(
    async (id, isActive) => {
      setMutating(true)
      try {
        const result = await apiClient.patch(endpoints.suppliers.status(id), { isActive })
        if (result.success) await reload(filtersRef.current)
        return result.success
          ? { success: true, data: mapSupplier(result.data) }
          : result
      } finally {
        setMutating(false)
      }
    },
    [reload],
  )

  return {
    items,
    pagination,
    filters,
    loading,
    mutating,
    error,
    updateFilters,
    setPage: (page) => updateFilters({ page }),
    reload: () => reload(filtersRef.current),
    createSupplier,
    updateSupplier,
    deleteSupplier,
    setSupplierActive,
  }
}
