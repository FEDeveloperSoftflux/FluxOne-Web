import { Package, Pencil, Trash2 } from 'lucide-react'
import { ProductImageCell } from '@/components/feature/products/ProductStatusToggle'
import { EmptyState } from '@/components/shared/EmptyState'
import { Pagination } from '@/components/shared/Pagination'
import { SurfaceCard } from '@/components/shared/SurfaceCard'
import { Button } from '@/components/ui/button'
import { TableRowsSkeleton } from '@/components/ui/skeleton'
import { formatMovementDateTime, shortId } from '@/lib/mapStockMovement'
import { cn } from '@/lib/utils'

/**
 * Shared ledger history table shell.
 * @param {{ columns: Array<{ key: string, label: string, className?: string, render: (row) => import('react').ReactNode }> }} props
 */
export function MovementHistoryTable({
  title,
  description,
  items = [],
  loading = false,
  pagination,
  columns = [],
  onPageChange,
  onEdit,
  onDelete,
  emptyTitle = 'No movements yet',
  emptyHint = 'Add a movement or adjust filters.',
  className,
}) {
  const list = Array.isArray(items) ? items : []
  const isEmpty = !loading && list.length === 0
  const page = pagination?.page || 1
  const pageCount = Math.max(1, pagination?.pageCount || 1)
  const total = pagination?.total ?? list.length
  const showActions = Boolean(onEdit || onDelete)

  return (
    <SurfaceCard
      className={className}
      title={title}
      description={description}
      actions={
        <span className="text-xs font-medium text-slate-400">
          {total} record{total === 1 ? '' : 's'} · 8 / page
        </span>
      }
    >
      {loading ? (
        <TableRowsSkeleton rows={6} />
      ) : isEmpty ? (
        <EmptyState icon={Package} title={emptyTitle} description={emptyHint} />
      ) : (
        <>
          <div className="overflow-x-auto -mx-1 px-1 sm:mx-0 sm:px-0">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm md:min-w-[720px]">
              <thead>
                <tr className="border-b border-border text-xs tracking-wide text-slate-400 uppercase">
                  {columns.map((col) => (
                    <th key={col.key} className={cn('px-2 py-2 font-semibold', col.className)}>
                      {col.label}
                    </th>
                  ))}
                  {showActions ? (
                    <th className="px-2 py-2 text-right font-semibold">Actions</th>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {list.map((row) => (
                  <tr key={row.id} className="border-b border-border/70 last:border-0">
                    {columns.map((col) => (
                      <td key={col.key} className={cn('px-2 py-3 align-middle', col.className)}>
                        {col.render(row)}
                      </td>
                    ))}
                    {showActions ? (
                      <td className="px-2 py-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          {onEdit ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="cursor-pointer"
                              onClick={() => onEdit(row)}
                              title="Edit"
                            >
                              <Pencil className="size-4" />
                            </Button>
                          ) : null}
                          {onDelete ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="cursor-pointer text-red-600 hover:text-red-700"
                              onClick={() => onDelete(row)}
                              title="Delete"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={page}
            pageCount={pageCount}
            loading={loading}
            onPageChange={onPageChange}
          />
        </>
      )}
    </SurfaceCard>
  )
}

export function movementImageNameColumns() {
  return [
    {
      key: 'id',
      label: 'Id',
      className: 'w-24',
      render: (row) => (
        <span className="font-mono text-xs text-slate-600" title={row.id}>
          {shortId(row.id)}
        </span>
      ),
    },
    {
      key: 'image',
      label: 'Image',
      className: 'w-14',
      render: (row) => <ProductImageCell src={row.imageUrl} name={row.productName} />,
    },
    {
      key: 'name',
      label: 'Name',
      render: (row) => (
        <div className="min-w-0">
          <p className="font-medium text-slate-900">{row.productName || '—'}</p>
          {row.itemCode ? (
            <p className="text-xs text-slate-400">{row.itemCode}</p>
          ) : null}
        </div>
      ),
    },
    {
      key: 'when',
      label: 'Date · Time',
      className: 'whitespace-nowrap',
      render: (row) => (
        <span className="text-slate-600">{formatMovementDateTime(row.createdAt)}</span>
      ),
    },
    {
      key: 'scale',
      label: 'Scale',
      render: (row) => <span className="capitalize text-slate-700">{row.scale || '—'}</span>,
    },
  ]
}
