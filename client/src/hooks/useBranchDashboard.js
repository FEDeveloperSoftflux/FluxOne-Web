import { useCallback, useEffect, useState } from 'react'
import { apiClient } from '@/api/api'
import { endpoints } from '@/api/endpoints'
import { BRANCH_DASHBOARD_DUMMY } from '@/data/branchDashboard'
import { mergeBranchDashboard } from '@/lib/mapBranchDashboard'

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Loads branch dashboard with OR fallback:
 * live API data when available, otherwise (or for missing fields) dummy data.
 */
export function useBranchDashboard(initialDate = todayIso()) {
  const [date, setDate] = useState(initialDate)
  const [data, setData] = useState(() => structuredClone(BRANCH_DASHBOARD_DUMMY))
  const [loading, setLoading] = useState(true)
  const [source, setSource] = useState('dummy')
  const [error, setError] = useState(null)

  const reload = useCallback(async (nextDate) => {
    setLoading(true)
    setError(null)
    try {
      const result = await apiClient.get(endpoints.branch.dashboard, { date: nextDate })
      if (result.success && result.data) {
        setData(mergeBranchDashboard({ ...result.data, date: nextDate }))
        setSource('live')
      } else {
        setData(mergeBranchDashboard({ date: nextDate }))
        setSource('dummy')
        setError(result.error || null)
      }
    } catch (err) {
      setData(mergeBranchDashboard({ date: nextDate }))
      setSource('dummy')
      setError(err?.message || 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    reload(date)
  }, [date, reload])

  return { data, date, setDate, loading, source, error, reload: () => reload(date) }
}
