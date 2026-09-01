import { useState } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Line,
  ComposedChart,
  Area,
} from 'recharts'
import { SurfaceCard } from '@/components/shared/SurfaceCard'
import { NativeSelect } from '@/components/ui/select'
import { BRAND } from '@/lib/constants'
import { TrendingUp, DollarSign, Building2, Trophy, BarChart3 } from 'lucide-react'

const BRANCH_COLORS = {
  wah: '#8E238F',
  haripur: '#3B82F6',
  taxilla: '#F59E0B',
  islamabad: '#10B981',
}

function formatShortCurrency(value) {
  if (value >= 1000000) {
    return `Rs. ${(value / 1000000).toFixed(1)}M`
  }
  if (value >= 1000) {
    return `Rs. ${(value / 1000).toFixed(0)}k`
  }
  return `Rs. ${value}`
}

export function BranchProfitOverviewChart({ data = {} }) {
  const [selectedBranch, setSelectedBranch] = useState('all')
  const [viewMetric, setViewMetric] = useState('profit') // 'profit' | 'revenue' | 'comparison'

  const branches = data.branches || []
  const monthlyData = data.monthlyData || []

  return (
    <SurfaceCard
      title="Branch Profit & Revenue Overview"
      description="Monthly graphical analysis of net profit and revenue performance across branches for current year (2026)"
      actions={
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Metric Toggle */}
          <div className="flex rounded-lg bg-slate-100 p-0.5 border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMetric('profit')}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                viewMetric === 'profit'
                  ? 'bg-white text-purple-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Net Profit
            </button>
            <button
              type="button"
              onClick={() => setViewMetric('revenue')}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                viewMetric === 'revenue'
                  ? 'bg-white text-purple-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Revenue vs Profit
            </button>
            <button
              type="button"
              onClick={() => setViewMetric('comparison')}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                viewMetric === 'comparison'
                  ? 'bg-white text-purple-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Branches
            </button>
          </div>

          {/* Branch Filter Dropdown */}
          <div className="w-44">
            <NativeSelect
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="h-8.5 py-0 text-xs font-medium bg-white"
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </NativeSelect>
          </div>
        </div>
      }
    >
      {/* High-End Floating Summary Chips */}
      <div className="flex flex-wrap items-center gap-3 mb-4 pt-1">
        <div className="flex items-center gap-2 rounded-xl bg-purple-50/80 border border-purple-100 px-3 py-1.5 text-xs font-semibold text-purple-950">
          <DollarSign className="size-3.5 text-purple-600" />
          <span>Total 2026 Profit: <strong>Rs. 48.24 M</strong></span>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50/80 border border-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-950">
          <TrendingUp className="size-3.5 text-emerald-600" />
          <span>Avg Margin: <strong>34.3%</strong></span>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-amber-50/80 border border-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-950">
          <Trophy className="size-3.5 text-amber-600" />
          <span>Top Branch: <strong>Wah Cantt</strong></span>
        </div>
      </div>

      {/* Graphical Representation */}
      <div className="h-72 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          {viewMetric === 'comparison' ? (
            <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickFormatter={formatShortCurrency}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                formatter={(val, name) => [
                  `Rs. ${Number(val).toLocaleString()}`,
                  name === 'wahProfit'
                    ? 'Wah Cantt'
                    : name === 'haripurProfit'
                    ? 'Haripur'
                    : name === 'taxillaProfit'
                    ? 'Taxilla'
                    : 'Islamabad',
                ]}
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                  fontSize: '12px',
                }}
              />
              <Legend
                formatter={(val) =>
                  val === 'wahProfit'
                    ? 'Wah Cantt'
                    : val === 'haripurProfit'
                    ? 'Haripur'
                    : val === 'taxillaProfit'
                    ? 'Taxilla'
                    : 'Islamabad'
                }
                wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
              />
              <Bar dataKey="wahProfit" fill={BRANCH_COLORS.wah} radius={[4, 4, 0, 0]} />
              <Bar dataKey="haripurProfit" fill={BRANCH_COLORS.haripur} radius={[4, 4, 0, 0]} />
              <Bar dataKey="taxillaProfit" fill={BRANCH_COLORS.taxilla} radius={[4, 4, 0, 0]} />
              <Bar dataKey="islamabadProfit" fill={BRANCH_COLORS.islamabad} radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : viewMetric === 'revenue' ? (
            <ComposedChart data={monthlyData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickFormatter={formatShortCurrency}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                formatter={(val, name) => [
                  `Rs. ${Number(val).toLocaleString()}`,
                  name === 'revenue' ? 'Gross Revenue' : 'Net Profit',
                ]}
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar dataKey="revenue" name="Gross Revenue" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
              <Bar dataKey="profit" name="Net Profit" fill={BRAND.purple} radius={[4, 4, 0, 0]} />
              <Line
                type="monotone"
                dataKey="profit"
                name="Profit Trend"
                stroke="#412283"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#412283' }}
              />
            </ComposedChart>
          ) : (
            <ComposedChart data={monthlyData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="profitGradRich" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={BRAND.purple} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={BRAND.purple} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickFormatter={formatShortCurrency}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                formatter={(val) => [`Rs. ${Number(val).toLocaleString()}`, 'Net Profit']}
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                  fontSize: '12px',
                }}
              />
              <Area
                type="monotone"
                dataKey={
                  selectedBranch === 'wah'
                    ? 'wahProfit'
                    : selectedBranch === 'haripur'
                    ? 'haripurProfit'
                    : selectedBranch === 'taxilla'
                    ? 'taxillaProfit'
                    : selectedBranch === 'islamabad'
                    ? 'islamabadProfit'
                    : 'profit'
                }
                name="Net Profit"
                stroke={BRAND.purple}
                strokeWidth={3}
                fill="url(#profitGradRich)"
              />
            </ComposedChart>
          )}
        </ResponsiveContainer>
      </div>
    </SurfaceCard>
  )
}
export default BranchProfitOverviewChart
