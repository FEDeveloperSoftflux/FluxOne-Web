import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { apiClient } from '@/api/api'
import { endpoints } from '@/api/endpoints'
import { API_BASE_URL } from '@/lib/constants'
import {
  downloadTextFile,
  mapProduct,
  splitProductWrite,
} from '@/lib/mapProduct'
import { productsToCsv } from '@/lib/productCsv'
import {
  getProductCatalog,
  peekProductCatalog,
  refreshProductCategories,
} from '@/lib/productCatalogCache'
import { tokenStorage } from '@/api/tokenStorage'

export const PRODUCTS_PAGE_SIZE = 8

/**
 * Live product catalog: list/filter/paginate + mutations.
 * Category chips drive categoryId / subcategoryId query params.
 * @param {{ skipList?: boolean }} options
 */
export function useProducts(initialFilters = {}, options = {}) {
  const skipList = Boolean(options.skipList)
  const [items, setItems] = useState([])
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PRODUCTS_PAGE_SIZE,
    total: 0,
    pageCount: 1,
  })
  const [filters, setFilters] = useState({
    q: '',
    type: '',
    categoryId: '',
    subcategoryId: '',
    status: 'active',
    page: 1,
    limit: PRODUCTS_PAGE_SIZE,
    ...initialFilters,
  })
  const [loading, setLoading] = useState(!skipList)
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
  const [bundleOptions, setBundleOptions] = useState([])
  const filtersRef = useRef(filters)
  filtersRef.current = filters

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

  const reloadCategories = useCallback(async () => {
    const next = await refreshProductCategories()
    setCatalog(next)
    return next
  }, [])

  const reload = useCallback(async (nextFilters = filtersRef.current) => {
    setLoading(true)
    setError(null)
    try {
      const result = await apiClient.get(endpoints.products.list, {
        page: nextFilters.page || 1,
        limit: nextFilters.limit || PRODUCTS_PAGE_SIZE,
        q: nextFilters.q || undefined,
        type: nextFilters.type || undefined,
        categoryId: nextFilters.categoryId || undefined,
        subcategoryId: nextFilters.subcategoryId || undefined,
        status: nextFilters.status || 'active',
      })
      if (!result.success) {
        setItems([])
        setError(result.error || 'Failed to load products')
        return result
      }
      const data = result.data || {}
      const rows = Array.isArray(data.items) ? data.items : Array.isArray(data) ? data : []
      setItems(rows.map(mapProduct))
      setPagination(
        data.pagination || {
          page: nextFilters.page || 1,
          limit: nextFilters.limit || PRODUCTS_PAGE_SIZE,
          total: rows.length,
          pageCount: 1,
        },
      )
      return result
    } catch (err) {
      setItems([])
      setError(err?.message || 'Failed to load products')
      return { success: false, error: err?.message }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCatalog()
  }, [loadCatalog])

  useEffect(() => {
    if (skipList) return
    reload(filters)
  }, [filters, reload, skipList])

  /** Load all single items for bundle picker (not just current products page). */
  const loadBundleOptions = useCallback(async () => {
    const collected = []
    let page = 1
    let pageCount = 1
    do {
      const result = await apiClient.get(endpoints.products.list, {
        type: 'single',
        status: 'active',
        page,
        limit: 50,
      })
      if (!result.success) {
        console.warn('[useProducts] loadBundleOptions failed', result.error)
        setBundleOptions([])
        return
      }
      const data = result.data || {}
      const rows = Array.isArray(data.items) ? data.items : []
      collected.push(...rows.map(mapProduct))
      pageCount = data.pagination?.pageCount || 1
      page += 1
    } while (page <= pageCount)
    console.debug('[useProducts] bundle options loaded', collected.length)
    setBundleOptions(collected)
  }, [])

  const updateFilters = useCallback((patch) => {
    setFilters((prev) => {
      const next = { ...prev, ...patch }
      const resetsPage =
        patch.q !== undefined ||
        patch.type !== undefined ||
        patch.categoryId !== undefined ||
        patch.subcategoryId !== undefined
      if (resetsPage && patch.page === undefined) next.page = 1
      return next
    })
  }, [])

  const selectedCategorySubs = useMemo(() => {
    if (!filters.categoryId) return []
    return catalog.childrenByParent.get(filters.categoryId) || []
  }, [catalog.childrenByParent, filters.categoryId])

  const createProduct = useCallback(
    async (fields) => {
      setMutating(true)
      try {
        const { json, image } = splitProductWrite(fields, { withConfirmed: true })
        console.debug('[useProducts] createProduct body', {
          categoryId: json.categoryId,
          subcategoryId: json.subcategoryId,
          offerId: json.offerId,
          taxIds: json.taxIds,
          type: json.type,
          hasImage: Boolean(image),
        })
        const path =
          fields.type === 'bundle' ? endpoints.products.bundles : endpoints.products.create
        const result = await apiClient.post(path, json)
        if (!result.success) return result

        const product = mapProduct(result.data || {})
        let imageWarning = null
        if (image && product.id) {
          const form = new FormData()
          form.append('image', image)
          const imageResult = await apiClient.patch(
            endpoints.products.update(product.id),
            form,
          )
          if (!imageResult.success) {
            imageWarning =
              imageResult.error ||
              'Product created but image upload failed. Edit the product to retry.'
            console.warn('[useProducts] image PATCH failed after create', imageWarning)
          }
        }

        await reload({ ...filtersRef.current, page: 1 })
        setFilters((prev) => ({ ...prev, page: 1 }))
        return { success: true, data: product, imageWarning }
      } finally {
        setMutating(false)
      }
    },
    [reload],
  )

  const updateProduct = useCallback(
    async (id, fields) => {
      setMutating(true)
      try {
        const { json, image } = splitProductWrite(fields, { withConfirmed: false })
        const patchBody = { ...json }
        delete patchBody.confirmed
        delete patchBody.categoryId
        delete patchBody.subcategoryId
        const result = await apiClient.patch(endpoints.products.update(id), patchBody)
        if (!result.success) return result
        if (image) {
          const form = new FormData()
          form.append('image', image)
          const imageResult = await apiClient.patch(endpoints.products.update(id), form)
          if (!imageResult.success) {
            return {
              success: false,
              error:
                imageResult.error ||
                'Details saved but image upload failed. Try again from Edit.',
            }
          }
        }
        await reload(filtersRef.current)
        return { success: true, data: mapProduct(result.data || { id, ...fields }) }
      } finally {
        setMutating(false)
      }
    },
    [reload],
  )

  const setProductStatus = useCallback(async (id, status) => {
    setMutating(true)
    try {
      const result = await apiClient.patch(endpoints.products.update(id), { status })
      if (result.success) {
        setItems((prev) => prev.map((row) => (row.id === id ? { ...row, status } : row)))
      }
      return result
    } finally {
      setMutating(false)
    }
  }, [])

  const deleteProduct = useCallback(
    async (id) => {
      setMutating(true)
      try {
        const result = await apiClient.delete(endpoints.products.remove(id))
        if (result.success) await reload(filtersRef.current)
        return result
      } finally {
        setMutating(false)
      }
    },
    [reload],
  )

  const exportCsv = useCallback(async () => {
    setMutating(true)
    try {
      const collected = []
      let page = 1
      let pageCount = 1
      do {
        const result = await apiClient.get(endpoints.products.list, {
          page,
          limit: 50,
          status: 'all',
        })
        if (!result.success) return result
        const data = result.data || {}
        const rows = Array.isArray(data.items) ? data.items.map(mapProduct) : []
        collected.push(...rows)
        pageCount = data.pagination?.pageCount || 1
        page += 1
      } while (page <= pageCount)

      if (!collected.length) {
        return { success: false, error: 'No products to export' }
      }
      downloadTextFile(
        `fluxone-products-${new Date().toISOString().slice(0, 10)}.csv`,
        productsToCsv(collected),
      )
      return { success: true, data: { exported: collected.length } }
    } finally {
      setMutating(false)
    }
  }, [])

  const importProducts = useCallback(
    async (rows) => {
      setMutating(true)
      try {
        const result = await apiClient.post(endpoints.products.import, { rows })
        if (result.success) {
          await reload({ ...filtersRef.current, page: 1, status: 'all' })
          await reloadCategories()
        }
        return result
      } finally {
        setMutating(false)
      }
    },
    [reload, reloadCategories],
  )

  const scanBarcode = useCallback(async (barcode) => {
    return apiClient.post(endpoints.products.scan, { barcode })
  }, [])

  const fetchProductDetail = useCallback(async (id) => {
    const result = await apiClient.get(endpoints.products.detail(id))
    if (!result.success) return result
    return { success: true, data: mapProduct(result.data) }
  }, [])

  const fetchBarcodePng = useCallback(async (id) => {
    const token = tokenStorage.getToken()
    const response = await fetch(`${API_BASE_URL}${endpoints.products.barcode(id)}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}` }
    }
    const blob = await response.blob()
    return { success: true, data: URL.createObjectURL(blob) }
  }, [])

  const createCategory = useCallback(
    async ({ name, parentId, image }) => {
      setMutating(true)
      try {
        let body
        if (image instanceof File && image.size > 0) {
          body = new FormData()
          body.append('name', name)
          if (parentId) body.append('parentId', parentId)
          body.append('image', image)
        } else {
          body = { name, ...(parentId ? { parentId } : {}) }
        }
        const path = parentId
          ? endpoints.products.subcategories
          : endpoints.products.categories
        const result = await apiClient.post(path, body)
        if (result.success) await reloadCategories()
        return result
      } finally {
        setMutating(false)
      }
    },
    [reloadCategories],
  )

  const updateCategory = useCallback(
    async (id, { name, image }) => {
      setMutating(true)
      try {
        let body
        if (image instanceof File && image.size > 0) {
          body = new FormData()
          if (name) body.append('name', name)
          body.append('image', image)
        } else {
          body = { name }
        }
        const result = await apiClient.patch(endpoints.products.category(id), body)
        if (result.success) await reloadCategories()
        return result
      } finally {
        setMutating(false)
      }
    },
    [reloadCategories],
  )

  const deleteCategory = useCallback(
    async (id) => {
      setMutating(true)
      try {
        const result = await apiClient.delete(endpoints.products.category(id))
        if (result.success) await reloadCategories()
        return result
      } finally {
        setMutating(false)
      }
    },
    [reloadCategories],
  )

  const setCategoryActive = useCallback(
    async (id, isActive) => {
      setMutating(true)
      try {
        const result = await apiClient.patch(endpoints.products.category(id), { isActive })
        if (result.success) await reloadCategories()
        return result
      } finally {
        setMutating(false)
      }
    },
    [reloadCategories],
  )

  return {
    items,
    pagination,
    filters,
    loading,
    catalogLoading,
    mutating,
    error,
    catalog,
    selectedCategorySubs,
    bundleOptions,
    updateFilters,
    setPage: (page) => updateFilters({ page }),
    reload: () => reload(filtersRef.current),
    loadCatalog,
    reloadCategories,
    loadBundleOptions,
    createProduct,
    updateProduct,
    setProductStatus,
    deleteProduct,
    importProducts,
    scanBarcode,
    fetchProductDetail,
    fetchBarcodePng,
    exportCsv,
    createCategory,
    updateCategory,
    deleteCategory,
    setCategoryActive,
  }
}
