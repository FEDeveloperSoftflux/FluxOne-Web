import { memo } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { Boxes, FolderTree, Layers } from 'lucide-react'
import { BRAND } from '@/lib/constants'
import { cn } from '@/lib/utils'

const KPI_META = [
  {
    key: 'totalCategories',
    label: 'Total Categories',
    icon: FolderTree,
  },
  {
    key: 'totalSubCategories',
    label: 'Total Sub Categories',
    icon: Layers,
  },
  {
    key: 'totalItems',
    label: 'Total Items',
    icon: Boxes,
  },
]

function formatCount(value) {
  return Number(value || 0).toLocaleString()
}

function InventoryKpiCardsComponent({ kpis = {}, loading = false, className }) {
  const reduceMotion = useReducedMotion()

  return (
    <div className={cn('grid grid-cols-1 gap-4 sm:grid-cols-3', className)}>
      {KPI_META.map((meta, index) => {
        const Icon = meta.icon
        return (
          <motion.article
            key={meta.key}
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.4, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
            whileHover={reduceMotion ? undefined : { y: -4 }}
            className="group relative cursor-pointer overflow-hidden rounded-2xl border border-border bg-white px-6 py-8 shadow-[0_8px_24px_rgba(15,23,42,0.04)] transition-shadow duration-200 hover:shadow-[0_12px_32px_rgba(65,34,131,0.1)]"
          >
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-1 opacity-90"
              style={{ background: `linear-gradient(90deg, ${BRAND.purple}, ${BRAND.deep})` }}
            />
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">
                  {meta.label}
                </p>
                {loading ? (
                  <div className="mt-3 h-8 w-20 animate-pulse rounded-lg bg-slate-100" />
                ) : (
                  <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                    {formatCount(kpis[meta.key])}
                  </p>
                )}
              </div>
              <div
                className="flex size-10 shrink-0 items-center justify-center rounded-xl text-white transition-transform duration-200 group-hover:scale-105"
                style={{ background: `linear-gradient(145deg, ${BRAND.purple}, ${BRAND.deep})` }}
              >
                <Icon className="size-5" strokeWidth={1.75} />
              </div>
            </div>
          </motion.article>
        )
      })}
    </div>
  )
}

export const InventoryKpiCards = memo(InventoryKpiCardsComponent)
