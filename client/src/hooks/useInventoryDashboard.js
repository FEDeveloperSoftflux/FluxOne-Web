// useInventoryDashboard — RTK dashboard slice wrapper (Express → RTK → hook → UI)
import { useCallback, useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/rtk/hooks'
import {
  ALERTS_PAGE_SIZE,
  fetchInventoryDashboard,
  fetchInventoryAlertsPage,
} from '@/rtk/features/dashboard/inventoryDashboardSlice'

export { ALERTS_PAGE_SIZE }

export function useInventoryDashboard() {
  const dispatch = useAppDispatch()
  const {
    kpis,
    alerts,
    alertsPagination,
    stockOutPie,
    alertsPage,
    loading,
    alertsLoading,
    error,
  } = useAppSelector((state) => state.inventoryDashboard)

  useEffect(() => {
    void dispatch(fetchInventoryDashboard())
  }, [dispatch])

  const setAlertsPage = useCallback(
    async (nextPage) => {
      const page = Math.max(1, Number(nextPage) || 1)
      if (page === alertsPage) return
      await dispatch(fetchInventoryAlertsPage(page))
    },
    [alertsPage, dispatch],
  )

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
    reload: () => dispatch(fetchInventoryDashboard()),
  }
}
