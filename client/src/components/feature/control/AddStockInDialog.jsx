import { useEffect, useMemo, useState } from 'react'
import { Check, ChevronLeft, ChevronRight } from 'lucide-react'
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
import { cn } from '@/lib/utils'

const STEPS = [
  { id: 1, label: '1. Select Item' },
  { id: 2, label: '2. Set Qty' },
  { id: 3, label: '3. Confirm' },
]

// Helper function to get tomorrow's date in YYYY-MM-DD format
function getTomorrowDateString() {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const year = tomorrow.getFullYear()
  const month = String(tomorrow.getMonth() + 1).padStart(2, '0')
  const day = String(tomorrow.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Helper function to validate expiry date - must be in future (not today, not past)
function validateExpiryDate(expiryDateString) {
  if (!expiryDateString) return true // Optional field

  let expiryDate

  // Handle different date formats
  if (expiryDateString.includes('/')) {
    // DD/MM/YYYY format
    const parts = expiryDateString.split('/')
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10)
      const month = parseInt(parts[1], 10)
      const year = parseInt(parts[2], 10)
      expiryDate = new Date(year, month - 1, day)
    }
  } else if (expiryDateString.includes('-')) {
    // YYYY-MM-DD format
    expiryDate = new Date(expiryDateString)
  } else {
    expiryDate = new Date(expiryDateString)
  }

  if (isNaN(expiryDate.getTime())) {
    return false
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  expiryDate.setHours(0, 0, 0, 0)

  // Date must be AFTER today (tomorrow or later) - not today, not past
  return expiryDate > today
}

/**
 * 3-step Add Stock wizard (Select Item → Set Qty → Confirm).
 * All selections use dropdowns; product starts unselected.
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

  const [step, setStep] = useState(1)
  const [categoryId, setCategoryId] = useState('')
  const [subcategoryId, setSubcategoryId] = useState('')
  const [productId, setProductId] = useState('')
  const [products, setProducts] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [supplierId, setSupplierId] = useState('')
  const [scale, setScale] = useState('unit')
  const [quantity, setQuantity] = useState('1')
  const [unitCost, setUnitCost] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [error, setError] = useState(null)
  const [expiryError, setExpiryError] = useState('') // New state for expiry error
  const [loadingOptions, setLoadingOptions] = useState(false)

  const subs = useMemo(() => {
    if (!categoryId || !childrenByParent?.get) return []
    return childrenByParent.get(categoryId) || []
  }, [categoryId, childrenByParent])

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === productId) || null,
    [products, productId],
  )

  const selectedSupplier = useMemo(
    () => suppliers.find((s) => s.id === supplierId) || null,
    [suppliers, supplierId],
  )

  useEffect(() => {
    if (!open) return
    setStep(1)
    setError(null)
    setExpiryError('')
    setCategoryId('')
    setSubcategoryId('')
    setProductId('')
    setProducts([])
    setSupplierId('')
    setScale('unit')
    setQuantity('1')
    setUnitCost('')
    setExpiresAt('')
    setLoadingOptions(true)
    void (async () => {
      const supRes = await fetchControlSuppliers()
      if (supRes.success) setSuppliers(supRes.items)
      setLoadingOptions(false)
    })()
  }, [open])

  useEffect(() => {
    if (!open) return
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
  }, [open, categoryId, subcategoryId])

  function goNext() {
    setError(null)
    setExpiryError('')
    
    if (step === 1) {
      if (!productId) {
        setError('Select a product')
        return
      }
      if (selectedProduct?.scale) setScale(selectedProduct.scale)
      if (selectedProduct?.purchasePrice != null && unitCost === '') {
        setUnitCost(String(selectedProduct.purchasePrice))
      }
      setStep(2)
      return
    }
    
    if (step === 2) {
      if (!scale || !(Number(quantity) > 0)) {
        setError('Enter a valid scale and positive quantity')
        return
      }
      
      setStep(3)
    }
  }

  function goBack() {
    setError(null)
    setExpiryError('')
    setStep((s) => Math.max(1, s - 1))
  }

  async function handleSave() {
    setError(null)
    setExpiryError('')
    
    if (!productId || !(Number(quantity) > 0) || !scale) {
      setError('Missing product, scale, or quantity')
      return
    }
    
    // Final validation for expiry date
    if (expiresAt && !validateExpiryDate(expiresAt)) {
      setExpiryError('Expired product cannot be added in stock')
      return
    }
    
    const payload = {
      supplierId: supplierId || undefined,
      lines: [
        {
          productId,
          scale,
          quantity: Number(quantity),
          unitCost:
            unitCost === '' || unitCost == null ? undefined : Number(unitCost),
          expiresAt: expiresAt || undefined,
        },
      ],
    }
    const result = await onSubmit?.(payload)
    if (result?.success) onOpenChange?.(false)
    else if (result?.error) setError(result.error)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Add New Stock</DialogTitle>
          <DialogDescription className="sr-only">
            Multi-step stock-in: select item, set quantity, confirm.
          </DialogDescription>
        </DialogHeader>

        <nav className="flex gap-1 border-b border-border pb-0" aria-label="Stock-in steps">
          {STEPS.map((s) => {
            const done = step > s.id
            const active = step === s.id
            return (
              <div
                key={s.id}
                className={cn(
                  'flex-1 border-b-2 pb-2 text-center text-sm font-semibold transition-colors',
                  active
                    ? 'border-transparent text-[#8E238F]'
                    : done
                      ? 'border-transparent text-emerald-600'
                      : 'border-transparent text-slate-400',
                )}
                style={
                  active
                    ? { borderBottomColor: BRAND.purple, color: BRAND.purple }
                    : done
                      ? { borderBottomColor: '#16a34a' }
                      : undefined
                }
              >
                {s.label}
              </div>
            )
          })}
        </nav>

        {step === 1 ? (
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <NativeSelect
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value)
                  setSubcategoryId('')
                  setProductId('')
                }}
              >
                <option value="">All Categories</option>
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
                onChange={(e) => {
                  setSubcategoryId(e.target.value)
                  setProductId('')
                }}
              >
                <option value="">All</option>
                {subs.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="space-y-1.5">
              <Label>Item</Label>
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
                    {p.name}
                    {p.scale ? ` (${p.scale})` : ''}
                  </option>
                ))}
              </NativeSelect>
              {!products.length && !loadingOptions ? (
                <p className="text-xs text-amber-700">No products match these filters.</p>
              ) : null}
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-4 pt-2">
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
              <Label>Quantity to Add</Label>
              <Input
                type="number"
                inputMode="numeric"
                min="1"
                step="1"
                value={quantity}
                placeholder="Enter quantity"
                onChange={(e) => {
                  const val = e.target.value
                  // Allow manual input of any number >= 1
                  if (val === '' || Number(val) >= 1) {
                    setQuantity(val)
                  }
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Company / Supplier</Label>
              <NativeSelect value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
                <option value="">Select supplier (optional)</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.companyName || s.name || s.id}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="space-y-1.5">
              <Label>Expiry date (optional)</Label>
              <Input
                type="date"
                value={expiresAt}
                min={getTomorrowDateString()}
                onChange={(e) => {
                  setExpiresAt(e.target.value)
                  // Clear error when user updates date
                  if (expiryError) setExpiryError('')
                }}
              />
              <p className="text-xs text-slate-500">
                When set, stock past this date is moved to Expired automatically.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>Unit cost (optional)</Label>
              <Input
                type="number"
                min="0"
                step="any"
                value={unitCost}
                onChange={(e) => setUnitCost(e.target.value)}
              />
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="pt-2">
            <div
              className="rounded-xl px-4 py-4 text-sm leading-relaxed text-slate-700"
              style={{ background: BRAND.soft }}
            >
              Adding{' '}
              <span className="font-bold" style={{ color: BRAND.purple }}>
                {quantity} {scale}
              </span>{' '}
              of{' '}
              <span className="font-bold" style={{ color: BRAND.purple }}>
                {selectedProduct?.name || 'item'}
              </span>
              {selectedSupplier ? (
                <>
                  {' '}
                  from{' '}
                  <span className="font-bold" style={{ color: BRAND.purple }}>
                    {selectedSupplier.companyName || selectedSupplier.name}
                  </span>
                </>
              ) : null}
              {expiresAt ? (
                <>
                  {' '}
                  (expires{' '}
                  <span className="font-bold" style={{ color: BRAND.purple }}>
                    {expiresAt}
                  </span>
                  )
                </>
              ) : null}
              . Confirm?
            </div>
          </div>
        ) : null}

        {error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        ) : null}

        <DialogFooter className="gap-2 sm:justify-end">
          {step > 1 ? (
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer transition-none"
              style={{ color: BRAND.purple, borderColor: BRAND.purple }}
              disabled={loading}
              onClick={goBack}
            >
              <ChevronLeft className="size-4" />
              Back
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer transition-none"
            style={{ color: BRAND.purple, borderColor: BRAND.purple }}
            disabled={loading}
            onClick={() => onOpenChange?.(false)}
          >
            Cancel
          </Button>
          {step < 3 ? (
            <Button
              type="button"
              className="cursor-pointer text-white transition-none"
              style={{ background: `linear-gradient(135deg, ${BRAND.purple}, ${BRAND.deep})` }}
              disabled={loading || loadingOptions}
              onClick={goNext}
            >
              Next
              <ChevronRight className="size-4" />
            </Button>
          ) : (
            <Button
              type="button"
              className="cursor-pointer text-white transition-none"
              style={{ background: `linear-gradient(135deg, ${BRAND.purple}, ${BRAND.deep})` }}
              disabled={loading}
              onClick={handleSave}
            >
              <Check className="size-4" />
              {loading ? 'Saving…' : 'Save'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
