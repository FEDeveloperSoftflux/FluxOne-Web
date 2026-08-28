// useInventoryControl — RTK control slice wrapper (Express → RTK → hook → UI)
import { useCallback, useEffect, useMemo } from 'react'
import { useAppDispatch, useAppSelector } from '@/rtk/hooks'
import { asResult, catalogActiveOnly } from '@/rtk/asResult'
import {
  CONTROL_PAGE_SIZE,
  ensureControlType,
  patchControlFilters,
  setControlPage,
  loadControlCatalog,
  fetchControlMovements,
  createMovement as createMovementThunk,
  updateMovement as updateMovementThunk,
  deleteMovement as deleteMovementThunk,
  stockInFromOrder as stockInFromOrderThunk,
  fetchControlProductOptions,
  fetchControlSuppliers,
  fetchApprovedPurchaseOrders,
  fetchPurchaseOrderDetail,
  fetchEmployeeLookups,
} from '@/rtk/features/control/controlSlice'

export { CONTROL_PAGE_SIZE }
export {
  fetchControlProductOptions,
  fetchControlSuppliers,
  fetchApprovedPurchaseOrders,
  fetchPurchaseOrderDetail,
  fetchEmployeeLookups,
}

const EMPTY_FILTERS = {}

const EMPTY_BUCKET = {
  items: [],
  pagination: {
    page: 1,
    limit: CONTROL_PAGE_SIZE,
    total: 0,
    pageCount: 1,
  },
  filters: {
    q: '',
    type: '',
    categoryId: '',
    subcategoryId: '',
    scale: '',
    page: 1,
    limit: CONTROL_PAGE_SIZE,
  },
  loading: true,
  mutating: false,
  error: null,
}

export function useInventoryControl(movementType, initialFilters = EMPTY_FILTERS) {
  const dispatch = useAppDispatch()
  const catalogRaw = useAppSelector((state) => state.control.catalog)
  const catalogLoading = useAppSelector((state) => state.control.catalogLoading)
  const bucket = useAppSelector(
    (state) => state.control.byType[movementType] || EMPTY_BUCKET,
  )
  const filters = bucket.filters
  const filtersKey = JSON.stringify(filters)

  const catalog = useMemo(() => catalogActiveOnly(catalogRaw), [catalogRaw])

  useEffect(() => {
    dispatch(ensureControlType({ movementType, initialFilters }))
  }, [dispatch, movementType, initialFilters])

  useEffect(() => {
    void dispatch(loadControlCatalog())
  }, [dispatch])

  useEffect(() => {
    if (!movementType) return
    void dispatch(
      fetchControlMovements({
        movementType,
        filters,
      }),
    )
  }, [dispatch, movementType, filtersKey])

  const updateFilters = useCallback(
    (patch) => {
      dispatch(patchControlFilters({ movementType, patch }))
    },
    [dispatch, movementType],
  )

  const setPage = useCallback(
    (page) => {
      dispatch(setControlPage({ movementType, page }))
    },
    [dispatch, movementType],
  )

  const selectedCategorySubs = useMemo(() => {
    if (!filters.categoryId) return []
    return catalog.childrenByParent.get(filters.categoryId) || []
  }, [catalog, filters.categoryId])

  const createMovement = useCallback(
    (body) =>
      asResult(dispatch(createMovementThunk({ movementType, body })).unwrap()),
    [dispatch, movementType],
  )

  const updateMovement = useCallback(
    (id, body) =>
      asResult(dispatch(updateMovementThunk({ movementType, id, body })).unwrap()),
    [dispatch, movementType],
  )

  const deleteMovement = useCallback(
    (id) => asResult(dispatch(deleteMovementThunk({ movementType, id })).unwrap()),
    [dispatch, movementType],
  )

  const stockInFromOrder = useCallback(
    (purchaseOrderId) =>
      asResult(
        dispatch(stockInFromOrderThunk({ movementType, purchaseOrderId })).unwrap(),
      ),
    [dispatch, movementType],
  )

  return {
    movementType,
    items: bucket.items,
    pagination: bucket.pagination,
    filters,
    loading: bucket.loading,
    mutating: bucket.mutating,
    error: bucket.error,
    catalog,
    catalogLoading,
    selectedCategorySubs,
    updateFilters,
    setPage,
    reload: () => dispatch(fetchControlMovements({ movementType, filters })),
    loadCatalog: ({ force = false } = {}) =>
      dispatch(loadControlCatalog({ force })).unwrap(),
    createMovement,
    updateMovement,
    deleteMovement,
    stockInFromOrder,
  }
}
