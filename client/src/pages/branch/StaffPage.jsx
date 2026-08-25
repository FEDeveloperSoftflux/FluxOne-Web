import { useRef, useState } from 'react'
import { Plus } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { MotionHeader, MotionReveal } from '@/components/shared/MotionReveal'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { StaffFilters } from '@/components/feature/branch/staff/StaffFilters'
import { StaffFormDialog } from '@/components/feature/branch/staff/StaffFormDialog'
import { StaffTable } from '@/components/feature/branch/staff/StaffTable'
import { Button } from '@/components/ui/button'
import { useBranchStaff } from '@/hooks/useBranchStaff'
import { BRAND } from '@/lib/constants'
import { toastError, toastSuccess } from '@/lib/toast'

function useDebouncedSearch(updateFilters) {
  const [localQ, setLocalQ] = useState('')
  const timerRef = useRef(null)

  function onSearchChange(q) {
    setLocalQ(q)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => updateFilters({ q }), 300)
  }

  return { localQ, onSearchChange }
}

export function StaffPage() {
  const {
    items,
    pagination,
    filters,
    loading,
    mutating,
    error,
    updateFilters,
    setPage,
    createStaff,
    updateStaff,
    setStaffStatus,
    deleteStaff,
  } = useBranchStaff()

  const { localQ, onSearchChange } = useDebouncedSearch(updateFilters)

  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState('create')
  const [editing, setEditing] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [statusUpdatingId, setStatusUpdatingId] = useState(null)

  function openCreate() {
    setFormMode('create')
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(row) {
    setFormMode('edit')
    setEditing(row)
    setFormOpen(true)
  }

  async function handleSubmit(fields) {
    const result =
      formMode === 'edit' && editing?.id
        ? await updateStaff(editing.id, fields)
        : await createStaff(fields)
    if (result.success) {
      toastSuccess(formMode === 'edit' ? 'Staff updated' : 'Staff created')
    } else {
      toastError(result.error || 'Save failed')
    }
    return result
  }

  async function handleStatusChange(row, status) {
    if (!row?.id || row.status === status) return
    setStatusUpdatingId(row.id)
    try {
      const result = await setStaffStatus(row.id, status)
      if (!result.success) toastError(result.error || 'Status update failed')
      else toastSuccess(status === 'inactive' || status === 'blocked' ? 'Staff deactivated' : 'Staff activated')
    } finally {
      setStatusUpdatingId(null)
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget?.id) return
    const result = await deleteStaff(deleteTarget.id)
    setDeleteTarget(null)
    if (result.success) toastSuccess('Staff deleted')
    else toastError(result.error || 'Delete failed')
  }

  return (
    <div className="space-y-5 pb-8 sm:space-y-6">
      <MotionHeader>
        <PageHeader
          eyebrow="Branch Team"
          title="Staff Management"
          description="Manage Inventory Managers and Cashiers for your branch only."
          actions={
            <Button
              type="button"
              onClick={openCreate}
              style={{ background: BRAND.purple }}
              className="w-full text-white hover:opacity-90 sm:w-auto"
            >
              <Plus className="size-4" />
              Add Staff
            </Button>
          }
        />
      </MotionHeader>

      {error ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-100">
          {error}
        </p>
      ) : null}

      <MotionReveal delay={0.04}>
        <StaffFilters
          q={localQ}
          status={filters.status || ''}
          onChange={(patch) => {
            if (patch.q !== undefined) onSearchChange(patch.q)
            if (patch.status !== undefined) updateFilters({ status: patch.status })
          }}
        />
      </MotionReveal>

      <MotionReveal delay={0.08}>
        <StaffTable
          items={items}
          loading={loading}
          pagination={pagination}
          onPageChange={setPage}
          onEdit={openEdit}
          onDelete={setDeleteTarget}
          onStatusChange={handleStatusChange}
          statusUpdatingId={statusUpdatingId}
        />
      </MotionReveal>

      <StaffFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={formMode}
        initialStaff={editing}
        loading={mutating}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        title="Delete staff?"
        description={
          deleteTarget
            ? `Permanently remove ${deleteTarget.fullName || deleteTarget.email}? Prefer Inactive if you only want to block login.`
            : undefined
        }
        confirmLabel="Delete"
        loading={mutating}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}

export default StaffPage
