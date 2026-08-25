import { useMemo } from 'react'
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
import { BRANCH_DASHBOARD_DUMMY } from '@/data/branchDashboard'

const CHART_H = 260
const MIX_COLORS = ['#8E238F', '#412283', '#16a34a', '#2563eb', '#ea580c', '#ef4444', '#0d9488', '#db2777']

function ProductTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const row = payload[0]?.payload
  return (
    <div className="rounded-xl border border-border bg-white px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold text-slate-800">{row.name}</p>
      <p className="mt-1 text-slate-600">{row.units} units sold</p>
    </div>
  )
}

function buildMixRows(productMix, topProducts, lowProducts) {
  if (Array.isArray(productMix) && productMix.length > 0) {
    return productMix.map((item) => ({
      name: item.name,
      units: Number(item.units ?? item.sales) || 0,
    }))
  }

  const merged = [...(topProducts || []), ...(lowProducts || [])]
  const seen = new Set()
  const fromParts = merged
    .filter((item) => {
      if (!item?.name || seen.has(item.name)) return false
      seen.add(item.name)
      return true
    })
    .map((item) => ({
      name: item.name,
      units: Number(item.units ?? item.sales) || 0,
    }))
    .sort((a, b) => b.units - a.units)

  if (fromParts.length > 0) return fromParts

  return BRANCH_DASHBOARD_DUMMY.productMix.map((item) => ({
    name: item.name,
    units: Number(item.units) || 0,
  }))
}

export function ProductSalesInsights({
  productMix = [],
  topProducts = [],
  lowProducts = [],
  className,
}) {
  const rows = useMemo(
    () => buildMixRows(productMix, topProducts, lowProducts),
    [productMix, topProducts, lowProducts],
  )

  return (
    <SurfaceCard
      className={className}
      title="Product mix"
      description="Highest vs lowest selling items today"
    >
      <div className="w-full" style={{ height: CHART_H, minHeight: CHART_H }}>
        <ResponsiveContainer width="100%" height={CHART_H}>
          <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 16, left: 4, bottom: 4 }}>
            <CartesianGrid stroke="#e8edf3" horizontal={false} />
            <XAxis
              type="number"
              domain={[0, 'auto']}
              tick={{ fill: '#64748b', fontSize: 11 }}
              axisLine={{ stroke: '#e2e8f0' }}
              tickLine={false}
              tickCount={6}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={52}
              tick={{ fill: '#334155', fontSize: 12, fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<ProductTooltip />} cursor={{ fill: 'rgba(142,35,143,0.05)' }} />
            <Bar dataKey="units" radius={[0, 6, 6, 0]} barSize={18}>
              {rows.map((entry, index) => (
                <Cell key={entry.name} fill={MIX_COLORS[index % MIX_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </SurfaceCard>
  )
}
