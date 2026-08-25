import { useRef, useState } from 'react'
import { ClipboardList, Plus } from 'lucide-react'
import { AddStockInDialog } from '@/components/feature/control/AddStockInDialog'
import { AdjustmentDialog } from '@/components/feature/control/AdjustmentDialog'
import { AdjustmentTable } from '@/components/feature/control/AdjustmentTable'
import { DamagedDialog } from '@/components/feature/control/DamagedDialog'
import { DamagedTable } from '@/components/feature/control/DamagedTable'
import { ExpiredDialog } from '@/components/feature/control/ExpiredDialog'
import { ExpiredTable } from '@/components/feature/control/ExpiredTable'
import { InventoryControlTabs } from '@/components/feature/control/InventoryControlTabs'
import { MovementFilters } from '@/components/feature/control/MovementFilters'
import { OrderDemandDialog } from '@/components/feature/control/OrderDemandDialog'
import { StockInTable } from '@/components/feature/control/StockInTable'
import { StockOutDialog } from '@/components/feature/control/StockOutDialog'
import { StockOutTable } from '@/components/feature/control/StockOutTable'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { MotionHeader, MotionReveal } from '@/components/shared/MotionReveal'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { useInventoryControl } from '@/hooks/useInventoryControl'
import { BRAND } from '@/lib/constants'
import { MOVEMENT_TYPES } from '@/lib/mapStockMovement'
import { toastError, toastSuccess } from '@/lib/toast'

function useDebouncedSearch(updateFilters) {
  const [localQ, setLocalQ] = useState('')
  const timerRef = useRef(null)

  function onSearchChange(q) {
    setLocalQ(q)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => updateFilters({ q }), 300)
  }

  return { localQ, setLocalQ, onSearchChange }
}

function ControlTabPanel({ tab }) {
  const {
    items,
    pagination,
    filters,
    loading,
    mutating,
    error,
    catalog,
    selectedCategorySubs,
    updateFilters,
    setPage,
    createMovement,
    updateMovement,
    deleteMovement,
    stockInFromOrder,
  } = useInventoryControl(tab)

  const { localQ, setLocalQ, onSearchChange } = useDebouncedSearch(updateFilters)

  const [addOpen, setAddOpen] = useState(false)
  const [orderOpen, setOrderOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  function handleFilterChange(patch) {
    if (patch.q !== undefined) setLocalQ(patch.q)
    updateFilters(patch)
  }

  async function handleCreate(payload) {
    const result = await createMovement(payload)
    if (result.success) toastSuccess('Saved')
    else toastError(result.error || 'Save failed')
    return result
  }

  async function handleUpdate(payload) {
    if (!editTarget?.id) return { success: false, error: 'Nothing to edit' }
    const result = await updateMovement(editTarget.id, payload)
    if (result.success) {
      setEditTarget(null)
      toastSuccess('Updated')
    } else {
      toastError(result.error || 'Update failed')
    }
    return result
  }

  async function handleConfirmDelete() {
    if (!deleteTarget?.id) return
    const result = await deleteMovement(deleteTarget.id)
    if (result.success) {
      setDeleteTarget(null)
      toastSuccess('Deleted')
    } else {
      toastError(result.error || 'Delete failed')
    }
  }

  async function handleReceiveOrder(purchaseOrderId) {
    const result = await stockInFromOrder(purchaseOrderId)
    if (result.success) toastSuccess('Purchase order received into stock')
    else toastError(result.error || 'Receive failed')
    return result
  }

  const titleActions = (
    <>
      {tab === MOVEMENT_TYPES.IN ? (
        <Button
          type="button"
          variant="outline"
          className="cursor-pointer"
          style={{ color: BRAND.deep }}
          onClick={() => setOrderOpen(true)}
        >
          <ClipboardList className="size-4" />
          By order demand
        </Button>
      ) : null}
      <Button
        type="button"
        className="cursor-pointer text-white"
        style={{ background: BRAND.purple }}
        onClick={() => setAddOpen(true)}
      >
        <Plus className="size-4" />
        {tab === MOVEMENT_TYPES.IN
          ? 'Add stock'
          : tab === MOVEMENT_TYPES.OUT
            ? 'Add stock out'
            : tab === MOVEMENT_TYPES.ADJUSTMENT
              ? 'Add adjustment'
              : tab === MOVEMENT_TYPES.DAMAGED
                ? 'Add damaged'
                : 'Add expired'}
      </Button>
    </>
  )

  return (
    <div className="space-y-4">
      {error ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-100">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-end gap-2">{titleActions}</div>

      <MotionReveal delay={0.04}>
        <MovementFilters
          q={localQ}
          type={filters.type || ''}
          scale={filters.scale || ''}
          categoryId={filters.categoryId || ''}
          subcategoryId={filters.subcategoryId || ''}
          categories={catalog.parents}
          subcategories={selectedCategorySubs}
          onSearchChange={onSearchChange}
          onChange={handleFilterChange}
        />
      </MotionReveal>

      <MotionReveal delay={0.08}>
        {tab === MOVEMENT_TYPES.IN ? (
          <StockInTable
            items={items}
            loading={loading}
            pagination={pagination}
            onPageChange={setPage}
          />
        ) : null}
        {tab === MOVEMENT_TYPES.OUT ? (
          <StockOutTable
            items={items}
            loading={loading}
            pagination={pagination}
            onPageChange={setPage}
          />
        ) : null}
        {tab === MOVEMENT_TYPES.ADJUSTMENT ? (
          <AdjustmentTable
            items={items}
            loading={loading}
            pagination={pagination}
            onPageChange={setPage}
            onEdit={setEditTarget}
            onDelete={setDeleteTarget}
          />
        ) : null}
        {tab === MOVEMENT_TYPES.DAMAGED ? (
          <DamagedTable
            items={items}
            loading={loading}
            pagination={pagination}
            onPageChange={setPage}
            onEdit={setEditTarget}
            onDelete={setDeleteTarget}
          />
        ) : null}
        {tab === MOVEMENT_TYPES.EXPIRED ? (
          <ExpiredTable
            items={items}
            loading={loading}
            pagination={pagination}
            onPageChange={setPage}
            onEdit={setEditTarget}
            onDelete={setDeleteTarget}
          />
        ) : null}
      </MotionReveal>

      {tab === MOVEMENT_TYPES.IN ? (
        <>
          <AddStockInDialog
            open={addOpen}
            onOpenChange={setAddOpen}
            catalog={catalog}
            loading={mutating}
            onSubmit={handleCreate}
          />
          <OrderDemandDialog
            open={orderOpen}
            onOpenChange={setOrderOpen}
            loading={mutating}
            onReceive={handleReceiveOrder}
          />
        </>
      ) : null}

      {tab === MOVEMENT_TYPES.OUT ? (
        <StockOutDialog
          open={addOpen}
          onOpenChange={setAddOpen}
          catalog={catalog}
          loading={mutating}
          onSubmit={handleCreate}
        />
      ) : null}

      {tab === MOVEMENT_TYPES.ADJUSTMENT ? (
        <>
          <AdjustmentDialog
            open={addOpen}
            onOpenChange={setAddOpen}
            mode="create"
            catalog={catalog}
            loading={mutating}
            onSubmit={handleCreate}
          />
          <AdjustmentDialog
            open={Boolean(editTarget)}
            onOpenChange={(open) => {
              if (!open) setEditTarget(null)
            }}
            mode="edit"
            initial={editTarget}
            catalog={catalog}
            loading={mutating}
            onSubmit={handleUpdate}
          />
        </>
      ) : null}

      {tab === MOVEMENT_TYPES.DAMAGED ? (
        <>
          <DamagedDialog
            open={addOpen}
            onOpenChange={setAddOpen}
            mode="create"
            catalog={catalog}
            loading={mutating}
            onSubmit={handleCreate}
          />
          <DamagedDialog
            open={Boolean(editTarget)}
            onOpenChange={(open) => {
              if (!open) setEditTarget(null)
            }}
            mode="edit"
            initial={editTarget}
            catalog={catalog}
            loading={mutating}
            onSubmit={handleUpdate}
          />
        </>
      ) : null}

      {tab === MOVEMENT_TYPES.EXPIRED ? (
        <>
          <ExpiredDialog
            open={addOpen}
            onOpenChange={setAddOpen}
            mode="create"
            catalog={catalog}
            loading={mutating}
            onSubmit={handleCreate}
          />
          <ExpiredDialog
            open={Boolean(editTarget)}
            onOpenChange={(open) => {
              if (!open) setEditTarget(null)
            }}
            mode="edit"
            initial={editTarget}
            catalog={catalog}
            loading={mutating}
            onSubmit={handleUpdate}
          />
        </>
      ) : null}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        title="Delete this record?"
        description={
          deleteTarget
            ? `Remove this ${tab} entry for ${deleteTarget.productName || 'item'}? On-hand stock will be reversed.`
            : undefined
        }
        confirmLabel="Delete"
        loading={mutating}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}

export function InventoryControlPage() {
  const [tab, setTab] = useState(MOVEMENT_TYPES.IN)

  return (
    <div className="space-y-6">
      <MotionHeader>
        <PageHeader
          eyebrow="Inventory"
          title="Control"
          description="Live stock movements — stock in, out, adjustments, damaged, and expired."
        />
      </MotionHeader>

      <MotionReveal delay={0.02}>
        <InventoryControlTabs value={tab} onChange={setTab} />
      </MotionReveal>

      {/* Remount panel per tab so each keeps its own list state cleanly */}
      <ControlTabPanel key={tab} tab={tab} />
    </div>
  )
}

export default InventoryControlPage
