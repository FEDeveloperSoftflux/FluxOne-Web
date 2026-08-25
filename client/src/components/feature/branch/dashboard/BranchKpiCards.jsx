import { motion, useReducedMotion } from 'motion/react'
import {
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  CircleDollarSign,
  Receipt,
  TrendingUp,
} from 'lucide-react'
import { BRAND } from '@/lib/constants'
import { formatCurrency, formatPct } from '@/lib/mapBranchDashboard'
import { cn } from '@/lib/utils'

const KPI_META = [
  {
    key: 'totalSales',
    label: 'Total Sales',
    icon: CircleDollarSign,
    changeKey: 'salesChangePct',
    format: formatCurrency,
  },
  {
    key: 'profit',
    label: 'Profit',
    icon: TrendingUp,
    changeKey: 'profitChangePct',
    format: formatCurrency,
  },
  {
    key: 'saleCount',
    label: 'Sale Count',
    icon: Receipt,
    format: (n) => Number(n).toLocaleString(),
  },
  {
    key: 'avgTicket',
    label: 'Avg. Ticket',
    icon: Banknote,
    format: formatCurrency,
  },
]

export function BranchKpiCards({ kpis = {}, className }) {
  const reduceMotion = useReducedMotion()

  return (
    <div className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4', className)}>
      {KPI_META.map((meta, index) => {
        const Icon = meta.icon
        const value = kpis[meta.key]
        const change = meta.changeKey ? Number(kpis[meta.changeKey]) : null
        const up = change != null && change >= 0

        return (
          <motion.article
            key={meta.key}
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.4, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
            whileHover={reduceMotion ? undefined : { y: -4 }}
            className="group relative cursor-pointer overflow-hidden rounded-2xl border border-border bg-white px-4 py-8 shadow-[0_8px_24px_rgba(15,23,42,0.04)] transition-shadow hover:shadow-[0_12px_32px_rgba(65,34,131,0.08)]"
          >
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-1 opacity-90"
              style={{ background: `linear-gradient(90deg, ${BRAND.purple}, ${BRAND.deep})` }}
            />
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">{meta.label}</p>
                <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                  {meta.format(value)}
                </p>
              </div>
              <div
                className="flex size-10 items-center justify-center rounded-xl text-white"
                style={{ background: `linear-gradient(145deg, ${BRAND.purple}, ${BRAND.deep})` }}
              >
                <Icon className="size-5" strokeWidth={1.75} />
              </div>
            </div>
            {change != null ? (
              <p
                className={cn(
                  'mt-3 inline-flex items-center gap-1 text-xs font-semibold',
                  up ? 'text-emerald-600' : 'text-rose-600',
                )}
              >
                {up ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
                {formatPct(change)} vs prior day
              </p>
            ) : (
              <p className="mt-3 text-xs text-slate-400">Branch overview for selected date</p>
            )}
          </motion.article>
        )
      })}
    </div>
  )
}
