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

/**
 * Stock-out create dialog.
 */
export function StockOutDialog({
  open,
  onOpenChange,
  catalog,
  loading = false,
  onSubmit,
}) {
  const parents = catalog?.parents || []
  const childrenByParent = catalog?.childrenByParent

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
    setCategoryId('')
    setSubcategoryId('')
    setQuantity('1')
    setReason('')
    void fetchControlProductOptions({ limit: 100 }).then((res) => {
      if (res.success) {
        setProducts(res.items)
        if (res.items[0]) {
          setProductId(res.items[0].id)
          setScale(res.items[0].scale || 'unit')
        }
      }
    })
  }, [open])

  useEffect(() => {
    if (!open) return
    let cancelled = false
    void fetchControlProductOptions({
      categoryId: categoryId || undefined,
      subcategoryId: subcategoryId || undefined,
      limit: 100,
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
  }, [open, categoryId, subcategoryId])

  async function handleSave() {
    setError(null)
    if (!productId) {
      setError('Select a product')
      return
    }
    if (!(Number(quantity) > 0)) {
      setError('Quantity must be positive')
      return
    }
    const payload = {
      productId,
      scale,
      quantity: Number(quantity),
      reason: reason.trim() || undefined,
    }
    const result = await onSubmit?.(payload)
    if (result?.success) onOpenChange?.(false)
    else if (result?.error) setError(result.error)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add stock out</DialogTitle>
          <DialogDescription>Remove stock from on-hand inventory.</DialogDescription>
        </DialogHeader>

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
        </div>

        <div className="space-y-1.5">
          <Label>Reason (optional)</Label>
          <Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
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
            {loading ? 'Saving…' : 'Save stock-out'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
