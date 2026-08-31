import { Search } from 'lucide-react'
import { SurfaceCard } from '@/components/shared/SurfaceCard'
import { Input } from '@/components/ui/input'
import { NativeSelect } from '@/components/ui/select'
import { Label } from '@/components/ui/label'

/**
 * Light filters for BM staff list: search + status.
 */
export function StaffFilters({
  q = '',
  status = '',
  designationId = '',
  designations = [],
  onChange,
  className,
}) {
  return (
    <SurfaceCard className={className} padding="compact">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1 space-y-1.5">
          <Label htmlFor="staff-search">Search</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              id="staff-search"
              value={q}
              placeholder="Search by name or ID…"
              className="pl-9"
              onChange={(event) => onChange?.({ q: event.target.value })}
            />
          </div>
        </div>

        <div className="w-full space-y-1.5 sm:w-48">
          <Label htmlFor="staff-designation-filter">Designation</Label>
          <NativeSelect
            id="staff-designation-filter"
            value={designationId}
            onChange={(event) => onChange?.({ designationId: event.target.value })}
          >
            <option value="">All designations</option>
            {designations.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </NativeSelect>
        </div>

        <div className="w-full space-y-1.5 sm:w-44">
          <Label htmlFor="staff-status-filter">Status</Label>
          <NativeSelect
            id="staff-status-filter"
            value={status}
            onChange={(event) => onChange?.({ status: event.target.value })}
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </NativeSelect>
        </div>
      </div>
    </SurfaceCard>
  )
}
