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
} from 'recharts'
import { SurfaceCard } from '@/components/shared/SurfaceCard'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, AlertTriangle, Boxes, Layers } from 'lucide-react'

export function BranchInventoryStatusChart({ data = {} }) {
  const summary = data.summary || {}
  const branches = data.branchBreakdown || []

  // Prepare chart data
  const chartData = branches.map((b) => ({
    name: b.branchName.replace(' Branch', '').replace(' Flagship', ''),
    fullName: b.branchName,
    Healthy: b.healthyStock,
    'Low Stock': b.lowStock,
    'Critical / Out': b.criticalStock + b.outOfStock,
    total: b.totalSkus,
    valuation: b.valuation,
  }))

  return (
    <SurfaceCard
      title="Branch Inventory Status (Today)"
      description="Graphical representation of today's stock health (Healthy, Low Stock & Critical) across each branch"
      actions={
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-semibold">
            <CheckCircle2 className="mr-1 size-3" />
            {summary.optimalRate || 81.4}% Optimal Stock
          </Badge>
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs font-semibold hidden sm:inline-flex">
            <Layers className="mr-1 size-3" />
            Valuation: {summary.totalValuation || 'Rs. 43.85 M'}
          </Badge>
        </div>
      }
    >
      <div className="h-64 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
            <XAxis type="number" stroke="#64748b" fontSize={11} tickLine={false} />
            <YAxis
              type="category"
              dataKey="name"
              stroke="#334155"
              fontSize={12}
              fontWeight={600}
              tickLine={false}
              axisLine={false}
              width={90}
            />
            <Tooltip
              formatter={(value, name) => [`${value} SKUs`, name]}
              contentStyle={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                fontSize: '12px',
              }}
            />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
            <Bar dataKey="Healthy" stackId="a" fill="#10B981" radius={[0, 0, 0, 0]} />
            <Bar dataKey="Low Stock" stackId="a" fill="#F59E0B" radius={[0, 0, 0, 0]} />
            <Bar dataKey="Critical / Out" stackId="a" fill="#EF4444" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </SurfaceCard>
  )
}
export default BranchInventoryStatusChart
