import { Building2, Pencil } from 'lucide-react'
import { EmptyState } from '@/components/shared/EmptyState'
import { Pagination } from '@/components/shared/Pagination'
import { SurfaceCard } from '@/components/shared/SurfaceCard'
import { Button } from '@/components/ui/button'
import { TableRowsSkeleton } from '@/components/ui/skeleton'
import { BRAND } from '@/lib/constants'
import { displaySupplierRef } from '@/lib/formatDisplayId'
import { ProductStatusToggle } from '@/components/feature/products/ProductStatusToggle'

/**
 * Supplier list matching tech lead columns.
 */
export function SupplierTable({
  items = [],
  loading = false,
  pagination,
  onPageChange,
  onEdit,
  onStatusChange,
  statusUpdatingId = null,
  className,
}) {
  const list = Array.isArray(items) ? items : []
  const isEmpty = !loading && list.length === 0
  const page = pagination?.page || 1
  const pageCount = Math.max(1, pagination?.pageCount || 1)
  const total = pagination?.total ?? list.length

  return (
    <SurfaceCard
      className={className}
      title="Supplier list"
      description="Companies you purchase from"
      actions={
        <span className="text-xs font-medium text-slate-400">
          {total} supplier{total === 1 ? '' : 's'} · 8 / page
        </span>
      }
    >
      {loading ? (
        <TableRowsSkeleton rows={5} />
      ) : isEmpty ? (
        <EmptyState
          icon={Building2}
          title="No suppliers yet"
          description="Add a supplier before generating purchase orders."
        />
      ) : (
        <div className="overflow-x-auto -mx-1 px-1 sm:mx-0 sm:px-0">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm lg:min-w-[960px]">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-slate-400">
                <th className="px-2 py-3 font-semibold">Image</th>
                <th className="px-2 py-3 font-semibold">Reference</th>
                <th className="px-2 py-3 font-semibold">Company</th>
                <th className="px-2 py-3 font-semibold">Company phone</th>
                <th className="px-2 py-3 font-semibold">Representative</th>
                <th className="px-2 py-3 font-semibold">Location</th>
                <th className="px-2 py-3 font-semibold">Tax paid</th>
                <th className="px-2 py-3 font-semibold">Reg / Bank</th>
                <th className="px-2 py-3 font-semibold">Signature</th>
                <th className="px-2 py-3 font-semibold">Status</th>
                <th className="px-2 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((row) => (
                <tr key={row.id} className="border-b border-border/70 align-top">
                  <td className="px-2 py-3">
                    {row.imageUrl ? (
                      <img
                        src={row.imageUrl}
                        alt=""
                        className="size-10 rounded-lg object-cover"
                      />
                    ) : (
                      <div
                        className="flex size-10 items-center justify-center rounded-lg text-xs font-bold text-white"
                        style={{
                          background: `linear-gradient(145deg, ${BRAND.purple}, ${BRAND.deep})`,
                        }}
                      >
                        {(row.companyName || '?').slice(0, 1).toUpperCase()}
                      </div>
                    )}
                  </td>
                  <td className="px-2 py-3 font-mono text-xs text-slate-600" title={row.id}>
                    {displaySupplierRef(row)}
                  </td>
                  <td className="px-2 py-3 font-medium text-slate-800">{row.companyName}</td>
                  <td className="px-2 py-3 text-slate-600">{row.companyPhone || '—'}</td>
                  <td className="px-2 py-3 text-slate-600">
                    <span className="block font-medium">{row.representativeName || '—'}</span>
                    <span className="block text-xs text-slate-400">
                      {row.representativePhone || '—'}
                    </span>
                    <span className="block text-xs text-slate-400">
                      {row.representativeEmail || '—'}
                    </span>
                  </td>
                  <td className="px-2 py-3 text-slate-600">{row.location || '—'}</td>
                  <td className="px-2 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        row.taxPaid
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {row.taxPaid ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-2 py-3 text-xs text-slate-500">
                    <span className="block">{row.registrationNumber || '—'}</span>
                    <span className="block font-mono">{row.bankAccountNumber || '—'}</span>
                  </td>
                  <td className="px-2 py-3">
                    {row.signatureUrl ? (
                      <img
                        src={row.signatureUrl}
                        alt="Signature"
                        className="h-8 max-w-[72px] object-contain"
                      />
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-2 py-3">
                    <ProductStatusToggle
                      status={row.isActive === false ? 'inactive' : 'active'}
                      loading={statusUpdatingId === row.id}
                      onChange={(status) =>
                        onStatusChange?.(row, status === 'active')
                      }
                    />
                  </td>
                  <td className="px-2 py-3">
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="cursor-pointer"
                        onClick={() => onEdit?.(row)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!isEmpty ? (
        <Pagination
          page={page}
          pageCount={pageCount}
          loading={loading}
          onPageChange={onPageChange}
        />
      ) : null}
    </SurfaceCard>
  )
}
