import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { SurfaceCard } from '@/components/shared/SurfaceCard'
import { BRAND } from '@/lib/constants'
import { formatCurrency } from '@/lib/mapBranchDashboard'

function CounterTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const row = payload[0]?.payload
  return (
    <div className="rounded-xl border border-border bg-white px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold text-slate-800">{row.name}</p>
      <p className="mt-1 text-slate-600">{formatCurrency(row.sales)}</p>
      <p className="text-slate-400">{row.orders} orders</p>
    </div>
  )
}

/** Shown only when more than one POS counter is installed. */
export function CounterSalesCard({ counters = [], className }) {
  if (!Array.isArray(counters) || counters.length <= 1) return null

  const total = counters.reduce((sum, c) => sum + (Number(c.sales) || 0), 0)
  const colors = [BRAND.purple, BRAND.deep, '#6366f1', '#0ea5e9']

  return (
    <SurfaceCard
      className={className}
      title="Counter Sales"
      description="Sales generated per POS terminal"
      actions={<p className="text-sm font-semibold text-slate-700">{formatCurrency(total)} combined</p>}
    >
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {counters.map((counter, index) => {
          const share = total > 0 ? ((Number(counter.sales) / total) * 100).toFixed(1) : '0.0'
          return (
            <div key={counter.id || counter.name} className="rounded-xl bg-slate-50/80 px-3 py-3">
              <p className="text-xs font-medium text-slate-500">{counter.name}</p>
              <p className="mt-1 text-lg font-bold text-slate-900">{formatCurrency(counter.sales)}</p>
              <p className="text-xs text-slate-400">
                {counter.orders} orders · {share}% share
              </p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${share}%`,
                    background: colors[index % colors.length],
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>

      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={counters} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fill: '#64748b', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${Math.round(v / 1000)}k`}
              width={36}
            />
            <Tooltip content={<CounterTooltip />} />
            <Bar dataKey="sales" radius={[8, 8, 0, 0]} barSize={36}>
              {counters.map((entry, index) => (
                <Cell key={entry.id || entry.name} fill={colors[index % colors.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </SurfaceCard>
  )
}
