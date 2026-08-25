import { useCallback, useEffect, useState } from 'react'
import { apiClient } from '@/api/api'
import { endpoints } from '@/api/endpoints'

const DEFAULT_LIMIT = 8

/** Build JSON or multipart body; never include branchId (server forces JWT branch). */
export function buildStaffPayload(fields) {
  const {
    fullName,
    email,
    password,
    role,
    hardwareDeviceId,
    scheduleStart,
    scheduleBreakStart,
    scheduleEnd,
    image,
  } = fields

  const base = {
    fullName: String(fullName || '').trim(),
    email: String(email || '').trim(),
    role,
    hardwareDeviceId: hardwareDeviceId?.trim() || undefined,
    scheduleStart: scheduleStart || undefined,
    scheduleBreakStart: scheduleBreakStart || undefined,
    scheduleBreakEnd: scheduleBreakStart || undefined,
    scheduleEnd: scheduleEnd || undefined,
  }

  if (password) base.password = password

  if (image instanceof File && image.size > 0) {
    const form = new FormData()
    Object.entries(base).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        form.append(key, String(value))
      }
    })
    form.append('image', image)
    return form
  }

  return base
}

/**
 * Branch Manager staff list + mutations (scoped by server JWT branchId).
 */
export function useBranchStaff(initialFilters = {}) {
  const [items, setItems] = useState([])
  const [pagination, setPagination] = useState({
    page: 1,
    limit: DEFAULT_LIMIT,
    total: 0,
    pageCount: 1,
  })
  const [filters, setFilters] = useState({
    q: '',
    status: 'active',
    page: 1,
    limit: DEFAULT_LIMIT,
    ...initialFilters,
  })
  const [loading, setLoading] = useState(true)
  const [mutating, setMutating] = useState(false)
  const [error, setError] = useState(null)

  const reload = useCallback(async (nextFilters = filters) => {
    setLoading(true)
    setError(null)
    try {
      const result = await apiClient.get(endpoints.branch.staff.list, {
        page: nextFilters.page || 1,
        limit: nextFilters.limit || DEFAULT_LIMIT,
        q: nextFilters.q || undefined,
        status: nextFilters.status || undefined,
        role: nextFilters.role || undefined,
        designationId: nextFilters.designationId || undefined,
      })
      if (!result.success) {
        setItems([])
        setError(result.error || 'Failed to load staff')
        return result
      }
      const data = result.data || {}
      setItems(Array.isArray(data.items) ? data.items : Array.isArray(data) ? data : [])
      setPagination(
        data.pagination || {
          page: nextFilters.page || 1,
          limit: nextFilters.limit || DEFAULT_LIMIT,
          total: Array.isArray(data.items) ? data.items.length : 0,
          pageCount: 1,
        },
      )
      return result
    } catch (err) {
      setItems([])
      setError(err?.message || 'Failed to load staff')
      return { success: false, error: err?.message }
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    reload(filters)
  }, [filters, reload])

  const updateFilters = useCallback((patch) => {
    setFilters((prev) => {
      const next = { ...prev, ...patch }
      if (patch.q !== undefined || patch.status !== undefined || patch.role !== undefined) {
        next.page = patch.page ?? 1
      }
      return next
    })
  }, [])

  const createStaff = useCallback(
    async (fields) => {
      setMutating(true)
      try {
        const body = buildStaffPayload(fields)
        const result = await apiClient.post(endpoints.branch.staff.create, body)
        if (result.success) await reload({ ...filters, page: 1 })
        return result
      } finally {
        setMutating(false)
      }
    },
    [filters, reload],
  )

  const updateStaff = useCallback(
    async (id, fields) => {
      setMutating(true)
      try {
        const body = buildStaffPayload(fields)
        const result = await apiClient.patch(endpoints.branch.staff.update(id), body)
        if (result.success) await reload(filters)
        return result
      } finally {
        setMutating(false)
      }
    },
    [filters, reload],
  )

  const setStaffStatus = useCallback(
    async (id, status) => {
      setMutating(true)
      try {
        const result = await apiClient.patch(endpoints.branch.staff.status(id), { status })
        if (result.success) {
          setItems((prev) =>
            prev.map((row) => (row.id === id ? { ...row, ...(result.data || { status }) } : row)),
          )
        }
        return result
      } finally {
        setMutating(false)
      }
    },
    [],
  )

  const deleteStaff = useCallback(
    async (id) => {
      setMutating(true)
      try {
        const result = await apiClient.delete(endpoints.branch.staff.delete(id))
        if (result.success) await reload(filters)
        return result
      } finally {
        setMutating(false)
      }
    },
    [filters, reload],
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
    reload: () => reload(filters),
    createStaff,
    updateStaff,
    setStaffStatus,
    deleteStaff,
  }
}
