import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Users } from 'lucide-react'
import { SurfaceCard } from '@/components/shared/SurfaceCard'
import { BRAND } from '@/lib/constants'
import { staffInitials } from '@/lib/mapBranchDashboard'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 5

const STATUS_STYLES = {
  active: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  on_break: 'bg-amber-50 text-amber-700 ring-amber-200',
  offline: 'bg-slate-100 text-slate-600 ring-slate-200',
}

function statusLabel(status) {
  if (status === 'on_break') return 'On break'
  if (status === 'offline') return 'Offline'
  return 'Active'
}

export function StaffPerformanceTable({ staff = [], className }) {
  const [page, setPage] = useState(0)
  const list = Array.isArray(staff) ? staff : []
  const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages - 1)

  const rows = useMemo(() => {
    const start = safePage * PAGE_SIZE
    return list.slice(start, start + PAGE_SIZE)
  }, [list, safePage])

  const showPager = list.length > PAGE_SIZE
  const isEmpty = list.length === 0

  return (
    <SurfaceCard
      className={className}
      title="Staff Performance"
      description="Name, ID, status & points"
      actions={
        <span className="text-xs font-medium text-slate-400">
          {list.length} team member{list.length === 1 ? '' : 's'}
        </span>
      }
    >
      {isEmpty ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-slate-50/80 px-4 py-12 text-center">
          <div
            className="flex size-12 items-center justify-center rounded-full"
            style={{ background: 'rgba(142, 35, 143, 0.1)', color: BRAND.purple }}
          >
            <Users className="size-6" strokeWidth={1.75} />
          </div>
          <p className="text-sm font-semibold text-slate-800">No staff available</p>
          <p className="max-w-xs text-xs text-slate-500">
            Staff assigned to this branch will appear here once loaded from the API.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs tracking-wide text-slate-500 uppercase">
                  <th className="px-2 py-2.5 font-medium">Employee</th>
                  <th className="px-2 py-2.5 font-medium">ID</th>
                  <th className="px-2 py-2.5 font-medium">Status</th>
                  <th className="px-2 py-2.5 text-right font-medium">Points</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((person) => (
                  <tr
                    key={person.id}
                    className="border-b border-border/70 transition-colors last:border-0 hover:bg-slate-50/80"
                  >
                    <td className="px-2 py-3">
                      <div className="flex items-center gap-3">
                        {person.image ? (
                          <img
                            src={person.image}
                            alt=""
                            className="size-9 rounded-full object-cover"
                          />
                        ) : (
                          <div
                            className="flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                            style={{ background: BRAND.purple }}
                          >
                            {staffInitials(person.name)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900">{person.name}</p>
                          <p className="truncate text-xs text-slate-500">{person.role || 'Staff'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-3 font-mono text-xs text-slate-600">{person.id}</td>
                    <td className="px-2 py-3">
                      <span
                        className={cn(
                          'inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset',
                          STATUS_STYLES[person.status] || STATUS_STYLES.offline,
                        )}
                      >
                        {statusLabel(person.status)}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-right font-semibold text-slate-900">
                      {Number(person.points || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {showPager ? (
            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-xs text-slate-500">
                Page {safePage + 1} of {totalPages}
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  aria-label="Previous page"
                  disabled={safePage === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="flex size-8 items-center justify-center rounded-lg border border-border text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <button
                  type="button"
                  aria-label="Next page"
                  disabled={safePage >= totalPages - 1}
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  className="flex size-8 items-center justify-center rounded-lg border border-border text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
          ) : null}
        </>
      )}
    </SurfaceCard>
  )
}
