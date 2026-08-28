import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogCancelButton,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NativeSelect } from '@/components/ui/select'
import { BRAND } from '@/lib/constants'
import { validateSupplierForm } from '@/lib/validation/supplierForm'
import { useFormBaseline } from '@/hooks/useFormBaseline'
import { IMAGE_ACCEPT, imageUploadHint, validateImageFile } from '@/lib/imageUpload'
import { toastError } from '@/lib/toast'

const EMPTY = {
  companyName: '',
  companyPhone: '',
  representativeName: '',
  representativePhone: '',
  representativeEmail: '',
  location: '',
  taxPaid: false,
  registrationNumber: '',
  bankAccountNumber: '',
  image: null,
  signature: null,
}

// Add / Edit supplier — fields align with tech lead + createSupplierSchema.

export function SupplierFormDialog({ open, onOpenChange, mode = 'create', initialSupplier = null, loading = false, onSubmit }) {
  const isEdit = mode === 'edit'
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState(null)
  const [imageError, setImageError] = useState(null)
  const [signatureError, setSignatureError] = useState(null)
  const { captureBaseline, isDirty } = useFormBaseline(open)

  function handleImageField(field, file, event) {
    const validationError = validateImageFile(file)
    if (field === 'image') setImageError(validationError)
    else setSignatureError(validationError)
    if (validationError) {
      toastError(validationError)
      event.target.value = ''
      patch(field, null)
      return
    }
    patch(field, file)
  }

  useEffect(() => {
    if (!open) return
    setError(null)
    setImageError(null)
    setSignatureError(null)
    if (isEdit && initialSupplier) {
      const nextForm = {
        companyName: initialSupplier.companyName || '',
        companyPhone: initialSupplier.companyPhone || '',
        representativeName: initialSupplier.representativeName || '',
        representativePhone: initialSupplier.representativePhone || '',
        representativeEmail: initialSupplier.representativeEmail || '',
        location: initialSupplier.location || '',
        taxPaid: Boolean(initialSupplier.taxPaid),
        registrationNumber: initialSupplier.registrationNumber || '',
        bankAccountNumber: initialSupplier.bankAccountNumber || '',
        image: null,
        signature: null,
      }
      setForm(nextForm)
      captureBaseline(nextForm)
    } else {
      setForm(EMPTY)
      captureBaseline(EMPTY)
    }
  }, [open, isEdit, initialSupplier])

  function patch(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)
    const validationError = validateSupplierForm(form)
    if (validationError) {
      setError(validationError)
      return
    }

    const result = await onSubmit?.(form)
    if (result?.success) onOpenChange?.(false)
    else if (result?.error) setError(result.error)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} dirty={isDirty(form)}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit supplier' : 'Add supplier'}</DialogTitle>
          <DialogDescription>
            Vendor master data used by purchase orders and product purchase history.
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        ) : null}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="sup-company">Company name</Label>
              <Input
                id="sup-company"
                value={form.companyName}
                onChange={(e) => patch('companyName', e.target.value)}
                placeholder="Company name"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sup-image">Image (optional)</Label>
              <Input
                id="sup-image"
                type="file"
                accept={IMAGE_ACCEPT}
                onChange={(e) => handleImageField('image', e.target.files?.[0] || null, e)}
              />
              <p className="text-[11px] text-slate-400">{imageUploadHint()}</p>
              {imageError ? <p className="text-xs text-red-600">{imageError}</p> : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sup-phone">Company contact number</Label>
              <Input
                id="sup-phone"
                value={form.companyPhone}
                onChange={(e) => patch('companyPhone', e.target.value)}
                placeholder="+92…"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sup-rep-name">Representative person name</Label>
              <Input
                id="sup-rep-name"
                value={form.representativeName}
                onChange={(e) => patch('representativeName', e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sup-rep-phone">Representative contact number</Label>
              <Input
                id="sup-rep-phone"
                value={form.representativePhone}
                onChange={(e) => patch('representativePhone', e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sup-rep-email">Representative email (optional)</Label>
              <Input
                id="sup-rep-email"
                type="email"
                value={form.representativeEmail}
                onChange={(e) => patch('representativeEmail', e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sup-location">Company location (optional)</Label>
              <Input
                id="sup-location"
                value={form.location}
                onChange={(e) => patch('location', e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sup-tax">Tax paid or not</Label>
              <NativeSelect
                id="sup-tax"
                value={form.taxPaid ? 'yes' : 'no'}
                onChange={(e) => patch('taxPaid', e.target.value === 'yes')}
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </NativeSelect>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sup-reg">Registration number (optional)</Label>
              <Input
                id="sup-reg"
                value={form.registrationNumber}
                onChange={(e) => patch('registrationNumber', e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sup-bank">Bank account number (optional)</Label>
              <Input
                id="sup-bank"
                value={form.bankAccountNumber}
                onChange={(e) => patch('bankAccountNumber', e.target.value)}
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="sup-signature">Digital signature (optional)</Label>
              <Input
                id="sup-signature"
                type="file"
                accept={IMAGE_ACCEPT}
                onChange={(e) => handleImageField('signature', e.target.files?.[0] || null, e)}
              />
              {signatureError ? <p className="text-xs text-red-600">{signatureError}</p> : null}
            </div>
          </div>

          <DialogFooter>
            <DialogCancelButton className="cursor-pointer" />
            <Button
              type="submit"
              className="cursor-pointer text-white"
              style={{ background: BRAND.purple }}
              disabled={loading}
            >
              {loading ? 'Saving…' : isEdit ? 'Save changes' : 'Add supplier'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
