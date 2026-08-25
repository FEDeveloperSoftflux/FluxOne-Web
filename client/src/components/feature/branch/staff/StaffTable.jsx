import { Pencil, Trash2, Users } from 'lucide-react'
import { EmptyState } from '@/components/shared/EmptyState'
import { Pagination } from '@/components/shared/Pagination'
import { SurfaceCard } from '@/components/shared/SurfaceCard'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { NativeSelect } from '@/components/ui/select'
import { staffInitials } from '@/lib/mapBranchDashboard'
import { BRAND } from '@/lib/constants'

function formatJoined(value) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return '—'
  }
}

function formatTime(value) {
  if (!value) return '—'
  const text = String(value)
  return text.length >= 5 ? text.slice(0, 5) : text
}

function designationLabel(row) {
  if (row?.designation) return row.designation
  if (row?.role === 'inventory_manager') return 'Inventory Manager'
  if (row?.role === 'cashier') return 'Cashier'
  return '—'
}

/**
 * Branch staff table with status control + edit/delete actions.
 */
export function StaffTable({
  items = [],
  loading = false,
  pagination,
  onPageChange,
  onEdit,
  onDelete,
  onStatusChange,
  statusUpdatingId = null,
  className,
}) {
  const list = Array.isArray(items) ? items : []
  const isEmpty = !loading && list.length === 0
  const page = pagination?.page || 1
  const pageCount = pagination?.pageCount || 1

  return (
    <SurfaceCard
      className={className}
      title="Team roster"
      description="Inventory managers & cashiers for this branch"
      actions={
        <span className="text-xs font-medium text-slate-400">
          {pagination?.total ?? list.length} member
          {(pagination?.total ?? list.length) === 1 ? '' : 's'}
        </span>
      }
    >
      {loading ? (
        <div className="space-y-3 py-6">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      ) : isEmpty ? (
        <EmptyState
          icon={Users}
          title="No staff available"
          description="Add an Inventory Manager or Cashier to get started."
          compact
        />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[56rem] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs tracking-wide text-slate-500 uppercase">
                  <th className="px-2 py-2.5 font-medium">ID</th>
                  <th className="px-2 py-2.5 font-medium">Name</th>
                  <th className="px-2 py-2.5 font-medium">Joined</th>
                  <th className="px-2 py-2.5 font-medium">Designation</th>
                  <th className="px-2 py-2.5 font-medium">Schedule</th>
                  <th className="px-2 py-2.5 font-medium">Hardware</th>
                  <th className="px-2 py-2.5 font-medium">Status</th>
                  <th className="px-2 py-2.5 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-border/70 transition-colors last:border-0 hover:bg-slate-50/80"
                  >
                    <td className="px-2 py-3 font-mono text-xs text-slate-600">{row.email || '—'}</td>
                    <td className="px-2 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-9">
                          {row.imageUrl ? (
                            <AvatarImage src={row.imageUrl} alt="" />
                          ) : (
                            <AvatarFallback
                              className="text-xs font-bold text-white"
                              style={{ background: BRAND.purple }}
                            >
                              {staffInitials(row.fullName)}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <p className="truncate font-semibold text-slate-900">{row.fullName || '—'}</p>
                      </div>
                    </td>
                    <td className="px-2 py-3 text-slate-600">
                      {formatJoined(row.joiningDate || row.createdAt)}
                    </td>
                    <td className="px-2 py-3 text-slate-700">{designationLabel(row)}</td>
                    <td className="px-2 py-3 text-xs text-slate-600">
                      <span className="whitespace-nowrap">
                        {formatTime(row.scheduleStart)} / {formatTime(row.scheduleBreakStart)} /{' '}
                        {formatTime(row.scheduleEnd)}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-slate-600">{row.hardwareDeviceId || '—'}</td>
                    <td className="px-2 py-3">
                      <NativeSelect
                        aria-label={`Status for ${row.fullName || row.email}`}
                        value={
                          row.status === 'inactive' || row.status === 'blocked'
                            ? 'inactive'
                            : 'active'
                        }
                        disabled={statusUpdatingId === row.id}
                        className="h-9 w-[7.5rem]"
                        onChange={(event) => onStatusChange?.(row, event.target.value)}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </NativeSelect>
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`Edit ${row.fullName || 'staff'}`}
                          onClick={() => onEdit?.(row)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`Delete ${row.fullName || 'staff'}`}
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={() => onDelete?.(row)}
                        >
                          <Trash2 className="size-4" />
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
            alwaysShow={(pagination?.total || 0) > (pagination?.limit || 8)}
          />
        </>
      )}
    </SurfaceCard>
  )
}
