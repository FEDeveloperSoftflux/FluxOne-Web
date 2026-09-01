import { StatCard } from '@/components/shared/StatsCards'
import {
  Banknote,
  CircleDollarSign,
  Receipt,
  TrendingUp,
} from 'lucide-react'
import { formatCurrency, formatPct } from '@/lib/mapBranchDashboard'
import { cn } from '@/lib/utils'

const KPI_META = [
  {
    key: 'totalSales',
    label: 'Total Sales',
    icon: CircleDollarSign,
    changeKey: 'salesChangePct',
    format: formatCurrency,
    subtitle: 'Daily branch turnover',
  },
  {
    key: 'profit',
    label: 'Gross Profit',
    icon: TrendingUp,
    changeKey: 'profitChangePct',
    format: formatCurrency,
    subtitle: 'Net margin earnings',
  },
  {
    key: 'saleCount',
    label: 'Transactions',
    icon: Receipt,
    format: (n) => Number(n || 0).toLocaleString(),
    subtitle: 'POS checkouts processed',
  },
  {
    key: 'avgTicket',
    label: 'Average Ticket',
    icon: Banknote,
    format: formatCurrency,
    subtitle: 'Average basket size',
  },
]

export function BranchKpiCards({ kpis = {}, className }) {
  return (
    <div className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4', className)}>
      {KPI_META.map((meta, index) => {
        const Icon = meta.icon
        const value = kpis[meta.key]
        const change = meta.changeKey ? Number(kpis[meta.changeKey]) : null
        const up = change != null && change >= 0

        return (
          <StatCard
            key={meta.key}
            index={index}
            label={meta.label}
            value={meta.format(value)}
            subtitle={meta.subtitle}
            icon={Icon}
            trend={change != null ? formatPct(change) : null}
            isUp={up}
            trendText="vs prior day"
          />
        )
      })}
    </div>
  )
}

export default BranchKpiCards
