// useBranchDashboard — RTK branchDashboard slice wrapper (Express → RTK → hook → UI)
import { useCallback, useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/rtk/hooks'
import {
  setBranchDashboardDate,
  fetchBranchDashboard,
} from '@/rtk/features/branch/branchDashboardSlice'

export function useBranchDashboard(initialDate) {
  const dispatch = useAppDispatch()
  const { data, date, loading, source, error } = useAppSelector(
    (state) => state.branchDashboard,
  )

  useEffect(() => {
    if (initialDate) dispatch(setBranchDashboardDate(initialDate))
  }, [dispatch, initialDate])

  useEffect(() => {
    void dispatch(fetchBranchDashboard(date))
  }, [dispatch, date])

  const setDate = useCallback(
    (next) => {
      dispatch(setBranchDashboardDate(next))
    },
    [dispatch],
  )

  return {
    data,
    date,
    setDate,
    loading,
    source,
    error,
    reload: () => dispatch(fetchBranchDashboard(date)),
  }
}
