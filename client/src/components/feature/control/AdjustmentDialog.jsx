import { useEffect, useMemo, useState } from 'react'
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
import { Textarea } from '@/components/ui/textarea'
import { NativeSelect } from '@/components/ui/select'
import { BRAND } from '@/lib/constants'
import { SCALE_OPTIONS } from '@/lib/mapProduct'
import { fetchControlProductOptions } from '@/hooks/useInventoryControl'

// Create / edit stock adjustment (reason required).
export function AdjustmentDialog({
  open,
  onOpenChange,
  mode = 'create',
  initial = null,
  catalog,
  loading = false,
  onSubmit,
}) {
  const parents = catalog?.parents || []
  const childrenByParent = catalog?.childrenByParent
  const isEdit = mode === 'edit'

  const [categoryId, setCategoryId] = useState('')
  const [subcategoryId, setSubcategoryId] = useState('')
  const [products, setProducts] = useState([])
  const [productId, setProductId] = useState('')
  const [scale, setScale] = useState('unit')
  const [quantity, setQuantity] = useState('1')
  const [reason, setReason] = useState('')
  const [error, setError] = useState(null)

  const subs = useMemo(() => {
    if (!categoryId || !childrenByParent?.get) return []
    return childrenByParent.get(categoryId) || []
  }, [categoryId, childrenByParent])

  useEffect(() => {
    if (!open) return
    setError(null)
    if (isEdit && initial) {
      setProductId(initial.productId || '')
      setScale(initial.scale || 'unit')
      setQuantity(String(initial.quantity ?? 1))
      setReason(initial.reason || '')
      setCategoryId('')
      setSubcategoryId('')
      setProducts([])
      return
    }
    setCategoryId('')
    setSubcategoryId('')
    setProductId('')
    setScale('unit')
    setQuantity('1')
    setReason('')
    setProducts([])
  }, [open, isEdit, initial])

  useEffect(() => {
    if (!open || isEdit) return
    let cancelled = false
    void fetchControlProductOptions({
      categoryId: categoryId || undefined,
      subcategoryId: subcategoryId || undefined,
      limit: 50,
    }).then((res) => {
      if (cancelled || !res.success) return
      setProducts(res.items)
      setProductId((prev) => (res.items.some((p) => p.id === prev) ? prev : ''))
    })
    return () => {
      cancelled = true
    }
  }, [open, isEdit, categoryId, subcategoryId])

  async function handleSave() {
    setError(null)
    if (!isEdit && !productId) {
      setError('Select a product')
      return
    }
    if (!scale || quantity === '' || Number.isNaN(Number(quantity))) {
      setError('Enter a valid quantity and scale')
      return
    }
    if (Number(quantity) === 0) {
      setError('Adjustment quantity cannot be zero')
      return
    }
    if (!reason || reason.trim().length < 3) {
      setError('Reason is required (min 3 characters)')
      return
    }
    const payload = isEdit
      ? { quantity: Number(quantity), reason: reason.trim() }
      : {
          productId,
          scale,
          quantity: Number(quantity),
          reason: reason.trim(),
        }
    const result = await onSubmit?.(payload)
    if (result?.success) onOpenChange?.(false)
    else if (result?.error) setError(result.error)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit adjustment' : 'Add adjustment'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update quantity or reason. On-hand stock will be recalculated.'
              : 'Positive qty increases stock; negative decreases it. Reason required.'}
          </DialogDescription>
        </DialogHeader>

        {!isEdit ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <NativeSelect
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value)
                  setSubcategoryId('')
                }}
              >
                <option value="">All</option>
                {parents.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="space-y-1.5">
              <Label>Sub category</Label>
              <NativeSelect
                value={subcategoryId}
                disabled={!categoryId}
                onChange={(e) => setSubcategoryId(e.target.value)}
              >
                <option value="">All</option>
                {subs.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Product</Label>
              <NativeSelect
                value={productId}
                onChange={(e) => {
                  const id = e.target.value
                  setProductId(id)
                  const p = products.find((x) => x.id === id)
                  if (p) setScale(p.scale || 'unit')
                }}
              >
                <option value="">Select product</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (on hand: {p.quantity})
                  </option>
                ))}
              </NativeSelect>
              {!products.length ? (
                <p className="text-xs text-amber-700">No products match these filters.</p>
              ) : null}
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-600">
            {initial?.productName || 'Product'} · {initial?.itemCode || ''}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3">
          {!isEdit ? (
            <div className="space-y-1.5">
              <Label>Scale</Label>
              <NativeSelect value={scale} onChange={(e) => setScale(e.target.value)}>
                {SCALE_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </NativeSelect>
            </div>
          ) : null}
          <div className={`space-y-1.5 ${isEdit ? 'col-span-2' : ''}`}>
            <Label>Quantity</Label>
            <Input
              type="number"
              step="any"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Reason</Label>
          <Textarea
            rows={3}
            value={reason}
            placeholder="Why is this adjustment needed?"
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        {error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        ) : null}

        <DialogFooter>
          <Button type="button" variant="outline" disabled={loading} onClick={() => onOpenChange?.(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            className="text-white"
            style={{ background: BRAND.purple }}
            disabled={loading}
            onClick={handleSave}
          >
            {loading ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
