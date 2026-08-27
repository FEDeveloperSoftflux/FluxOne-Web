import { Package, Pencil, Printer } from 'lucide-react'
import { BarcodeCell } from '@/components/feature/products/BarcodeCell'
import { PricingColumns } from '@/components/feature/products/PricingColumns'
import { ProductImageCell, ProductStatusToggle } from '@/components/feature/products/ProductStatusToggle'
import { PromotionColumns } from '@/components/feature/products/PromotionColumns'
import { EmptyState } from '@/components/shared/EmptyState'
import { Pagination } from '@/components/shared/Pagination'
import { SurfaceCard } from '@/components/shared/SurfaceCard'
import { Button } from '@/components/ui/button'
import { TableRowsSkeleton } from '@/components/ui/skeleton'
import { money } from '@/lib/mapProduct'

export function ProductTable({
  items = [],
  loading = false,
  pagination,
  statusUpdatingId = null,
  onPageChange,
  onEdit,
  onPrintBarcode,
  onStatusChange,
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
      title="Product catalog"
      description="Single items & bundles for this company"
      actions={
        <span className="text-xs font-medium text-slate-400">
          {total} item{total === 1 ? '' : 's'} · 8 / page
        </span>
      }
    >
      {loading ? (
        <TableRowsSkeleton rows={6} />
      ) : isEmpty ? (
        <EmptyState
          icon={Package}
          title="No product available"
          description="Try another category or type, or add a single item / bundle to get started."
        />
      ) : (
        <>
          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {list.map((row) => (
              <article
                key={row.id}
                className="rounded-xl border border-border bg-slate-50/60 px-3 py-3"
              >
                <div className="flex items-start gap-3">
                  <ProductImageCell src={row.imageUrl} name={row.name} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">{row.name}</p>
                        <p className="font-mono text-[11px] text-slate-400">{row.itemCode}</p>
                      </div>
                      <ProductStatusToggle
                        status={row.status}
                        loading={statusUpdatingId === row.id}
                        onChange={(status) => onStatusChange?.(row, status)}
                      />
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {row.scale} · {row.type}
                    </p>
                    <div className="mt-2">
                      <PricingColumns row={row} />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="cursor-pointer"
                        onClick={() => onPrintBarcode?.(row)}
                      >
                        <Printer className="size-3.5" />
                        PDF
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="cursor-pointer"
                        onClick={() => onEdit?.(row)}
                      >
                        <Pencil className="size-3.5" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border text-[11px] tracking-wide text-slate-500 uppercase">
                  <th className="px-2 py-3 font-semibold">Image</th>
                  <th className="px-2 py-3 font-semibold">Scale</th>
                  <th className="px-2 py-3 font-semibold">Item code</th>
                  <th className="px-2 py-3 font-semibold">Barcode</th>
                  <th className="px-2 py-3 font-semibold">Prices</th>
                  <th className="px-2 py-3 font-semibold">Discount & offers</th>
                  <th className="px-2 py-3 font-semibold">Purchase vendors</th>
                  <th className="px-2 py-3 font-semibold">Selling</th>
                  <th className="px-2 py-3 font-semibold">Status</th>
                  <th className="px-2 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {list.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-border/70 last:border-0 hover:bg-slate-50/80"
                  >
                    <td className="px-2 py-3">
                      <div className="flex items-center gap-2">
                        <ProductImageCell src={row.imageUrl} name={row.name} />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-900" title={row.name}>
                            {row.name}
                          </p>
                          <p className="text-[11px] capitalize text-slate-400">{row.type}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-3 text-slate-700">{row.scale}</td>
                    <td className="px-2 py-3 font-mono text-xs text-slate-600">{row.itemCode}</td>
                    <td className="max-w-[120px] px-2 py-3">
                      <BarcodeCell value={row.barcode} />
                    </td>
                    <td className="px-2 py-3">
                      <PricingColumns row={row} />
                    </td>
                    <td className="px-2 py-3">
                      <PromotionColumns row={row} />
                    </td>
                    <td className="px-2 py-3 text-xs leading-snug">
                      <p>
                        <span className="text-slate-400">Last</span>{' '}
                        <span className="font-medium">{money(row.lastPurchasePrice)}</span>
                        {row.lastPurchaseVendorName ? (
                          <span className="block text-slate-400">{row.lastPurchaseVendorName}</span>
                        ) : null}
                      </p>
                      <p className="mt-1">
                        <span className="text-slate-400">Current</span>{' '}
                        <span className="font-medium">{money(row.purchasePrice)}</span>
                        {row.currentPurchaseVendorName ? (
                          <span className="block text-slate-400">
                            {row.currentPurchaseVendorName}
                          </span>
                        ) : null}
                      </p>
                    </td>
                    <td className="px-2 py-3 text-xs leading-snug">
                      <p>
                        <span className="text-slate-400">Last</span>{' '}
                        <span className="font-medium">{money(row.lastSellingPrice)}</span>
                      </p>
                      <p className="mt-1">
                        <span className="text-slate-400">Current</span>{' '}
                        <span className="font-semibold">{money(row.sellingPrice)}</span>
                      </p>
                    </td>
                    <td className="px-2 py-3">
                      <ProductStatusToggle
                        status={row.status}
                        loading={statusUpdatingId === row.id}
                        onChange={(status) => onStatusChange?.(row, status)}
                      />
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="cursor-pointer"
                          title="Download barcode PDF"
                          onClick={() => onPrintBarcode?.(row)}
                        >
                          <Printer className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="cursor-pointer"
                          title="Edit"
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
