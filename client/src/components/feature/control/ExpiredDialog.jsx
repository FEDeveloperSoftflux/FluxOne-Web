import { useEffect, useMemo, useState } from 'react'
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
import { Textarea } from '@/components/ui/textarea'
import { NativeSelect } from '@/components/ui/select'
import { BRAND } from '@/lib/constants'
import { SCALE_OPTIONS } from '@/lib/mapProduct'
import {
  fetchControlProductOptions,
  fetchControlSuppliers,
} from '@/hooks/useInventoryControl'
import { useFormBaseline } from '@/hooks/useFormBaseline'

function toDateInput(value) {
  if (!value) return ''
  try {
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return ''
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  } catch {
    return ''
  }
}

// Create / edit expired product record.
export function ExpiredDialog({
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
  const [suppliers, setSuppliers] = useState([])
  const [productId, setProductId] = useState('')
  const [scale, setScale] = useState('unit')
  const [quantity, setQuantity] = useState('1')
  const [expiresAt, setExpiresAt] = useState('')
  const [supplierId, setSupplierId] = useState('')
  const [reason, setReason] = useState('')
  const [error, setError] = useState(null)
  const { captureBaseline, isDirty } = useFormBaseline(open)

  const formSnapshot = useMemo(
    () => ({
      categoryId,
      subcategoryId,
      productId,
      scale,
      quantity,
      expiresAt,
      supplierId,
      reason,
    }),
    [categoryId, subcategoryId, productId, scale, quantity, expiresAt, supplierId, reason],
  )

  const subs = useMemo(() => {
    if (!categoryId || !childrenByParent?.get) return []
    return childrenByParent.get(categoryId) || []
  }, [categoryId, childrenByParent])

  useEffect(() => {
    if (!open) return
    setError(null)
    void fetchControlSuppliers().then((res) => {
      if (res.success) setSuppliers(res.items)
    })
    if (isEdit && initial) {
      const snapshot = {
        categoryId: '',
        subcategoryId: '',
        productId: initial.productId || '',
        scale: initial.scale || 'unit',
        quantity: String(Math.abs(Number(initial.quantity ?? 1))),
        expiresAt: toDateInput(initial.expiresAt),
        supplierId: initial.supplierId || '',
        reason: initial.reason || '',
      }
      setProductId(snapshot.productId)
      setScale(snapshot.scale)
      setQuantity(snapshot.quantity)
      setExpiresAt(snapshot.expiresAt)
      setSupplierId(snapshot.supplierId)
      setReason(snapshot.reason)
      captureBaseline(snapshot)
      return
    }
    const snapshot = {
      categoryId: '',
      subcategoryId: '',
      productId: '',
      scale: 'unit',
      quantity: '1',
      expiresAt: '',
      supplierId: '',
      reason: '',
    }
    setCategoryId(snapshot.categoryId)
    setSubcategoryId(snapshot.subcategoryId)
    setQuantity(snapshot.quantity)
    setExpiresAt(snapshot.expiresAt)
    setSupplierId(snapshot.supplierId)
    setReason(snapshot.reason)
    setProductId(snapshot.productId)
    setProducts([])
    captureBaseline(snapshot)
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
      if (res.items[0]) {
        setProductId(res.items[0].id)
        setScale(res.items[0].scale || 'unit')
      } else setProductId('')
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
    if (!(Number(quantity) > 0)) {
      setError('Quantity must be positive')
      return
    }
    if (!expiresAt) {
      setError('Expiry date is required')
      return
    }
    const payload = isEdit
      ? {
          quantity: Number(quantity),
          expiresAt,
          supplierId: supplierId || undefined,
          reason: reason.trim() || undefined,
        }
      : {
          productId,
          scale,
          quantity: Number(quantity),
          expiresAt,
          supplierId: supplierId || undefined,
          reason: reason.trim() || undefined,
        }
    const result = await onSubmit?.(payload)
    if (result?.success) onOpenChange?.(false)
    else if (result?.error) setError(result.error)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} dirty={isDirty(formSnapshot)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit expired item' : 'Add expired product'}</DialogTitle>
          <DialogDescription>
            Remove expired stock from on-hand. Expiry date is required.
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
                {!products.length ? <option value="">No products</option> : null}
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (on hand: {p.quantity})
                  </option>
                ))}
              </NativeSelect>
            </div>
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
          </div>
        ) : (
          <p className="text-sm text-slate-600">{initial?.productName || 'Product'}</p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Quantity</Label>
            <Input
              type="number"
              min="0.001"
              step="any"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Expires at</Label>
            <Input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Company / supplier (optional)</Label>
          <NativeSelect value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
            <option value="">None</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.companyName || s.name || s.id}
              </option>
            ))}
          </NativeSelect>
        </div>

        <div className="space-y-1.5">
          <Label>Reason (optional)</Label>
          <Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>

        {error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        ) : null}

        <DialogFooter>
          <DialogCancelButton disabled={loading} />
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
