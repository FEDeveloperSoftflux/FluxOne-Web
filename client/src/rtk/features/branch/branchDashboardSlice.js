// Branch Dashboard Slice — Express /api/branch/dashboard → RTK → useBranchDashboard
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { apiClient } from '@/api/api'
import { endpoints } from '@/api/endpoints'
import { BRANCH_DASHBOARD_DUMMY } from '@/data/branchDashboard'
import { mergeBranchDashboard } from '@/lib/mapBranchDashboard'

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

const initialState = {
  date: todayIso(),
  data: structuredClone(BRANCH_DASHBOARD_DUMMY),
  loading: false,
  source: 'dummy',
  error: null,
}

export const fetchBranchDashboard = createAsyncThunk(
  'branchDashboard/fetch',
  async (nextDate, { rejectWithValue }) => {
    const date = nextDate || todayIso()
    try {
      const result = await apiClient.get(endpoints.branch.dashboard, { date })
      if (result.success && result.data) {
        return {
          date,
          data: mergeBranchDashboard({ ...result.data, date }),
          source: 'live',
          error: null,
        }
      }
      return {
        date,
        data: mergeBranchDashboard({ date }),
        source: 'dummy',
        error: result.error || null,
      }
    } catch (err) {
      return rejectWithValue({
        date,
        message: err?.message || 'Failed to load dashboard',
      })
    }
  },
)

const branchDashboardSlice = createSlice({
  name: 'branchDashboard',
  initialState,
  reducers: {
    setBranchDashboardDate(state, action) {
      state.date = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBranchDashboard.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchBranchDashboard.fulfilled, (state, action) => {
        state.loading = false
        state.date = action.payload.date
        state.data = action.payload.data
        state.source = action.payload.source
        state.error = action.payload.error
      })
      .addCase(fetchBranchDashboard.rejected, (state, action) => {
        state.loading = false
        const date = action.payload?.date || state.date
        state.date = date
        state.data = mergeBranchDashboard({ date })
        state.source = 'dummy'
        state.error = action.payload?.message || action.error.message
      })
  },
})

export const { setBranchDashboardDate } = branchDashboardSlice.actions
export default branchDashboardSlice.reducer
