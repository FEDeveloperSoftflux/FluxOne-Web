import { useEffect, useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
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
import { SCALE_OPTIONS } from '@/lib/mapProduct'
import {
  fetchControlProductOptions,
  fetchControlSuppliers,
} from '@/hooks/useInventoryControl'

function emptyLine(product) {
  return {
    productId: product?.id || '',
    scale: product?.scale || 'unit',
    quantity: 1,
    unitCost: product?.purchasePrice != null ? Number(product.purchasePrice) : '',
  }
}

/**
 * Multi-line stock-in dialog (optional supplier).
 */
export function AddStockInDialog({
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
  const [supplierId, setSupplierId] = useState('')
  const [suppliers, setSuppliers] = useState([])
  const [products, setProducts] = useState([])
  const [lines, setLines] = useState([])
  const [error, setError] = useState(null)
  const [loadingOptions, setLoadingOptions] = useState(false)

  const subs = useMemo(() => {
    if (!categoryId || !childrenByParent?.get) return []
    return childrenByParent.get(categoryId) || []
  }, [categoryId, childrenByParent])

  useEffect(() => {
    if (!open) return
    setError(null)
    setCategoryId('')
    setSubcategoryId('')
    setSupplierId('')
    setLines([])
    setProducts([])
    setLoadingOptions(true)
    void (async () => {
      const [supRes, prodRes] = await Promise.all([
        fetchControlSuppliers(),
        fetchControlProductOptions({ limit: 100 }),
      ])
      if (supRes.success) setSuppliers(supRes.items)
      if (prodRes.success) setProducts(prodRes.items)
      setLoadingOptions(false)
    })()
  }, [open])

  useEffect(() => {
    if (!open) return
    let cancelled = false
    void (async () => {
      const result = await fetchControlProductOptions({
        categoryId: categoryId || undefined,
        subcategoryId: subcategoryId || undefined,
        limit: 100,
      })
      if (cancelled) return
      if (result.success) setProducts(result.items)
    })()
    return () => {
      cancelled = true
    }
  }, [open, categoryId, subcategoryId])

  function addLine() {
    const first = products[0]
    if (!first) {
      setError('No products match the selected category filters')
      return
    }
    setError(null)
    setLines((prev) => [...prev, emptyLine(first)])
  }

  function patchLine(index, field, value) {
    setLines((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row
        const next = { ...row, [field]: value }
        if (field === 'productId') {
          const product = products.find((p) => p.id === value)
          if (product) {
            next.scale = product.scale || 'unit'
            next.unitCost =
              product.purchasePrice != null ? Number(product.purchasePrice) : next.unitCost
          }
        }
        return next
      }),
    )
  }

  function removeLine(index) {
    setLines((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSave() {
    setError(null)
    if (!lines.length) {
      setError('Add at least one item')
      return
    }
    for (const line of lines) {
      if (!line.productId || !(Number(line.quantity) > 0) || !line.scale) {
        setError('Each line needs a product, scale, and positive quantity')
        return
      }
    }
    const payload = {
      supplierId: supplierId || undefined,
      lines: lines.map((line) => ({
        productId: line.productId,
        scale: line.scale,
        quantity: Number(line.quantity),
        unitCost:
          line.unitCost === '' || line.unitCost == null
            ? undefined
            : Number(line.unitCost),
      })),
    }
    const result = await onSubmit?.(payload)
    if (result?.success) onOpenChange?.(false)
    else if (result?.error) setError(result.error)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add new stock</DialogTitle>
          <DialogDescription>
            Receive one or more products in a single stock-in (optional supplier).
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="stockin-cat">Category</Label>
            <NativeSelect
              id="stockin-cat"
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value)
                setSubcategoryId('')
              }}
            >
              <option value="">All categories</option>
              {parents.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="stockin-sub">Sub category</Label>
            <NativeSelect
              id="stockin-sub"
              value={subcategoryId}
              disabled={!categoryId}
              onChange={(e) => setSubcategoryId(e.target.value)}
            >
              <option value="">All in category</option>
              {subs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="stockin-supplier">Supplier (optional)</Label>
            <NativeSelect
              id="stockin-supplier"
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
            >
              <option value="">No supplier</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.companyName || s.name || s.id}
                </option>
              ))}
            </NativeSelect>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Lines</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="cursor-pointer"
              disabled={loadingOptions || !products.length}
              onClick={addLine}
            >
              <Plus className="size-4" />
              Add item
            </Button>
          </div>

          {!lines.length ? (
            <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-slate-500">
              Add one or more products for this stock-in.
            </p>
          ) : (
            <div className="max-h-64 space-y-2 overflow-y-auto">
              {lines.map((line, index) => (
                <div
                  key={index}
                  className="grid grid-cols-12 items-end gap-2 rounded-lg border border-border bg-slate-50/60 p-2"
                >
                  <div className="col-span-12 space-y-1 sm:col-span-5">
                    <Label className="text-xs">Product</Label>
                    <NativeSelect
                      value={line.productId}
                      onChange={(e) => patchLine(index, 'productId', e.target.value)}
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.itemCode || '—'})
                        </option>
                      ))}
                    </NativeSelect>
                  </div>
                  <div className="col-span-4 space-y-1 sm:col-span-2">
                    <Label className="text-xs">Scale</Label>
                    <NativeSelect
                      value={line.scale}
                      onChange={(e) => patchLine(index, 'scale', e.target.value)}
                    >
                      {SCALE_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </NativeSelect>
                  </div>
                  <div className="col-span-4 space-y-1 sm:col-span-2">
                    <Label className="text-xs">Qty</Label>
                    <Input
                      type="number"
                      min="0.001"
                      step="any"
                      value={line.quantity}
                      onChange={(e) => patchLine(index, 'quantity', e.target.value)}
                    />
                  </div>
                  <div className="col-span-3 space-y-1 sm:col-span-2">
                    <Label className="text-xs">Unit cost</Label>
                    <Input
                      type="number"
                      min="0"
                      step="any"
                      value={line.unitCost}
                      onChange={(e) => patchLine(index, 'unitCost', e.target.value)}
                    />
                  </div>
                  <div className="col-span-1 flex justify-end pb-0.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="cursor-pointer text-red-600"
                      onClick={() => removeLine(index)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        ) : null}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer"
            disabled={loading}
            onClick={() => onOpenChange?.(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="cursor-pointer text-white"
            style={{ background: BRAND.purple }}
            disabled={loading || loadingOptions}
            onClick={handleSave}
          >
            {loading ? 'Saving…' : 'Save stock-in'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
