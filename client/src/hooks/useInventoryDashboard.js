import { useCallback, useEffect, useRef, useState } from 'react'
import { apiClient } from '@/api/api'
import { endpoints } from '@/api/endpoints'
import {
  EMPTY_KPIS,
  normalizeAlertsPayload,
  normalizeKpis,
  normalizeStockGraph,
} from '@/lib/mapInventoryDashboard'

export const ALERTS_PAGE_SIZE = 8

/**
 * Inventory dashboard — live API only (empty/zero when no data or on error).
 */
export function useInventoryDashboard() {
  const [kpis, setKpis] = useState(() => ({ ...EMPTY_KPIS }))
  const [alerts, setAlerts] = useState([])
  const [alertsPagination, setAlertsPagination] = useState({
    page: 1,
    limit: ALERTS_PAGE_SIZE,
    total: 0,
    pageCount: 1,
  })
  const [stockOutPie, setStockOutPie] = useState([])
  const [alertsPage, setAlertsPageState] = useState(1)
  const [loading, setLoading] = useState(true)
  const [alertsLoading, setAlertsLoading] = useState(false)
  const [error, setError] = useState(null)
  const mountedRef = useRef(false)

  const applyAlertsResponse = useCallback((alertsRes, page) => {
    if (alertsRes.success) {
      const normalized = normalizeAlertsPayload(alertsRes.data, {
        page,
        limit: ALERTS_PAGE_SIZE,
      })
      setAlerts(normalized.items)
      setAlertsPagination(normalized.pagination)
      return { error: null }
    }

    setAlerts([])
    setAlertsPagination({
      page,
      limit: ALERTS_PAGE_SIZE,
      total: 0,
      pageCount: 1,
    })
    return { error: alertsRes.error || null }
  }, [])

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    setError(null)

    const page = 1
    setAlertsPageState(page)

    const [overviewRes, alertsRes, graphRes] = await Promise.all([
      apiClient.get(endpoints.dashboard.overview),
      apiClient.get(endpoints.dashboard.alerts, {
        page,
        limit: ALERTS_PAGE_SIZE,
      }),
      apiClient.get(endpoints.dashboard.stockGraph),
    ])

    const errors = []

    if (overviewRes.success && overviewRes.data) {
      setKpis(normalizeKpis(overviewRes.data))
    } else {
      setKpis({ ...EMPTY_KPIS })
      if (overviewRes.error) errors.push(overviewRes.error)
    }

    const alertsMeta = applyAlertsResponse(alertsRes, page)
    if (alertsMeta.error) errors.push(alertsMeta.error)

    if (graphRes.success) {
      setStockOutPie(normalizeStockGraph(graphRes.data).items)
    } else {
      setStockOutPie([])
      if (graphRes.error) errors.push(graphRes.error)
    }

    setError(errors.length ? errors[0] : null)
    setLoading(false)
  }, [applyAlertsResponse])

  const setAlertsPage = useCallback(
    async (nextPage) => {
      const page = Math.max(1, Number(nextPage) || 1)
      if (page === alertsPage && mountedRef.current) return

      setAlertsPageState(page)
      setAlertsLoading(true)

      try {
        const alertsRes = await apiClient.get(endpoints.dashboard.alerts, {
          page,
          limit: ALERTS_PAGE_SIZE,
        })
        const alertsMeta = applyAlertsResponse(alertsRes, page)
        if (alertsMeta.error) setError(alertsMeta.error)
      } finally {
        setAlertsLoading(false)
      }
    },
    [alertsPage, applyAlertsResponse],
  )

  useEffect(() => {
    mountedRef.current = true
    loadDashboard()
  }, [loadDashboard])

  return {
    kpis,
    alerts,
    alertsPagination,
    stockOutPie,
    alertsPage,
    setAlertsPage,
    loading,
    alertsLoading,
    error,
    reload: loadDashboard,
  }
}
