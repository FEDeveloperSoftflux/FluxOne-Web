import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NativeSelect } from '@/components/ui/select'
import { BRAND } from '@/lib/constants'

const EMPTY_FORM = {
  email: '',
  password: '',
  fullName: '',
  role: 'inventory_manager',
  hardwareDeviceId: '',
  scheduleStart: '',
  scheduleBreakStart: '',
  scheduleEnd: '',
  image: null,
}

function timeInputValue(value) {
  if (!value) return ''
  const text = String(value)
  return text.length >= 5 ? text.slice(0, 5) : text
}

/**
 * Add / Edit staff modal for Branch Manager.
 * Does not send branchId — server scopes from JWT.
 */
export function StaffFormDialog({
  open,
  onOpenChange,
  mode = 'create',
  initialStaff = null,
  onSubmit,
  loading = false,
}) {
  const isEdit = mode === 'edit'
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!open) return
    setError(null)
    if (isEdit && initialStaff) {
      setForm({
        email: initialStaff.email || '',
        password: '',
        fullName: initialStaff.fullName || '',
        role: (() => {
          const allowed = [
            'inventory_manager',
            'cashier',
            'production_staff',
            'delivery_staff',
          ]
          if (allowed.includes(initialStaff.role)) return initialStaff.role
          const designation = String(initialStaff.designation || '').toLowerCase()
          if (designation.includes('delivery')) return 'delivery_staff'
          if (designation.includes('production')) return 'production_staff'
          if (designation.includes('cashier')) return 'cashier'
          return 'inventory_manager'
        })(),
        hardwareDeviceId: initialStaff.hardwareDeviceId || '',
        scheduleStart: timeInputValue(initialStaff.scheduleStart),
        scheduleBreakStart: timeInputValue(initialStaff.scheduleBreakStart),
        scheduleEnd: timeInputValue(initialStaff.scheduleEnd),
        image: null,
      })
    } else {
      setForm(EMPTY_FORM)
    }
  }, [open, isEdit, initialStaff])

  function patch(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)

    if (!form.fullName.trim()) {
      setError('Name is required')
      return
    }
    if (!form.email.trim()) {
      setError('ID (login) is required')
      return
    }
    if (!isEdit && (!form.password || form.password.length < 8)) {
      setError('Password must be at least 8 characters')
      return
    }
    if (isEdit && form.password && form.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    const result = await onSubmit?.(form)
    if (result && result.success === false) {
      setError(result.error || 'Save failed')
      return
    }
    onOpenChange?.(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Staff' : 'Add Staff'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update branch staff details. Leave password blank to keep the current one.'
              : 'Create an Inventory Manager or Cashier for this branch only.'}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="staff-email">ID (login)</Label>
              <Input
                id="staff-email"
                autoComplete="off"
                placeholder="e.g. im.wah01"
                value={form.email}
                onChange={(e) => patch('email', e.target.value)}
              />
              <p className="text-xs text-slate-500">Used with password at login (maps to API email).</p>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="staff-password">
                Password {isEdit ? <span className="font-normal text-slate-400">(optional)</span> : null}
              </Label>
              <Input
                id="staff-password"
                type="password"
                autoComplete="new-password"
                placeholder={isEdit ? 'Leave blank to keep current' : 'Min. 8 characters'}
                value={form.password}
                onChange={(e) => patch('password', e.target.value)}
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="staff-name">Name</Label>
              <Input
                id="staff-name"
                value={form.fullName}
                placeholder="Full name"
                onChange={(e) => patch('fullName', e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="staff-role">Designation</Label>
              <NativeSelect
                id="staff-role"
                value={form.role}
                onChange={(e) => patch('role', e.target.value)}
              >
                <option value="inventory_manager">Inventory Manager</option>
                <option value="cashier">Cashier</option>
                <option value="production_staff">Production Staff</option>
                <option value="delivery_staff">Delivery Staff</option>
              </NativeSelect>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="staff-hardware">Hardware</Label>
              <Input
                id="staff-hardware"
                value={form.hardwareDeviceId}
                placeholder="Device / POS ID"
                onChange={(e) => patch('hardwareDeviceId', e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="staff-start">Start Time</Label>
              <Input
                id="staff-start"
                type="time"
                value={form.scheduleStart}
                onChange={(e) => patch('scheduleStart', e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="staff-break">Break Time</Label>
              <Input
                id="staff-break"
                type="time"
                value={form.scheduleBreakStart}
                onChange={(e) => patch('scheduleBreakStart', e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="staff-end">End Time</Label>
              <Input
                id="staff-end"
                type="time"
                value={form.scheduleEnd}
                onChange={(e) => patch('scheduleEnd', e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="staff-image">Photo (optional)</Label>
              <Input
                id="staff-image"
                type="file"
                accept="image/*"
                onChange={(e) => patch('image', e.target.files?.[0] || null)}
              />
            </div>
          </div>

          {error ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-100">
              {error}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              className="w-full sm:w-auto"
              onClick={() => onOpenChange?.(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              style={{ background: BRAND.purple }}
              className="w-full text-white hover:opacity-90 sm:w-auto"
            >
              {loading ? 'Saving…' : isEdit ? 'Save changes' : 'Add Staff'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
