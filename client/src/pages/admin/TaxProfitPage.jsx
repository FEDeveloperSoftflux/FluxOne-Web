import { useState } from 'react'
import { SurfaceCard } from '@/components/shared/SurfaceCard'
import { PageHeader } from '@/components/shared/PageHeader'
import { MotionHeader, MotionReveal } from '@/components/shared/MotionReveal'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NativeSelect } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { BRAND } from '@/lib/constants'
import { toastSuccess, toastError } from '@/lib/toast'
import { validatePercentage } from '@/lib/validation/formValidators'
import {
  INITIAL_TAX_PROFIT_PRODUCTS,
  TAX_PROFIT_CATEGORIES,
  TAX_PROFIT_SCALES,
} from '@/data/adminTaxProfitMock'
import {
  Percent,
  Calculator,
  Search,
  SlidersHorizontal,
  CheckSquare,
  Square,
  TrendingUp,
  Award,
  Zap,
  Tag,
  Check,
  Columns,
  Sparkles,
} from 'lucide-react'

export function TaxProfitPage() {
  const [products, setProducts] = useState(INITIAL_TAX_PROFIT_PRODUCTS)
  const [selectedIds, setSelectedIds] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All Categories')
  const [selectedScale, setSelectedScale] = useState('All Scales')
  const [presetFilter, setPresetFilter] = useState('all') // 'all' | 'top_selling' | 'top_profit' | 'top_popular'

  // Dialogs
  const [profitDialogOpen, setProfitDialogOpen] = useState(false)
  const [taxDialogOpen, setTaxDialogOpen] = useState(false)
  const [bulkProfitValue, setBulkProfitValue] = useState('20')
  const [bulkTaxValue, setBulkTaxValue] = useState('5')

  // Customizable Column Visibility
  const [visibleColumns, setVisibleColumns] = useState({
    id: true,
    name: true,
    image: true,
    barcode: true,
    category: true,
    baseCost: true,
    profitPct: true,
    taxPct: true,
    finalPrice: true,
  })
  const [colMenuOpen, setColMenuOpen] = useState(false)

  // Calculate Final Price helper
  function calculateFinalPrice(baseCost, profitPct, taxPct) {
    const profitAmount = (baseCost * (profitPct || 0)) / 100
    const taxAmount = (baseCost * (taxPct || 0)) / 100
    return Math.round(baseCost + profitAmount + taxAmount)
  }

  // Select all checkbox
  const isAllSelected =
    products.length > 0 && selectedIds.length === products.length

  function handleToggleSelectAll() {
    if (isAllSelected) {
      setSelectedIds([])
    } else {
      setSelectedIds(products.map((p) => p.id))
    }
  }

  function handleToggleRow(id) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    )
  }

  // Apply Bulk Profit %
  function handleApplyBulkProfit(e) {
    e.preventDefault()
    const err = validatePercentage(bulkProfitValue, { min: 0, max: 100, fieldName: 'Profit percentage' })
    if (err) {
      toastError(err)
      return
    }

    const profitNum = Number(bulkProfitValue)
    setProducts((prev) =>
      prev.map((p) => {
        if (selectedIds.includes(p.id)) {
          return { ...p, profitPct: profitNum }
        }
        return p
      }),
    )

    toastSuccess(
      `Updated Profit to ${profitNum}% across ${selectedIds.length} selected items`,
    )
    setProfitDialogOpen(false)
  }

  // Apply Bulk Tax %
  function handleApplyBulkTax(e) {
    e.preventDefault()
    const err = validatePercentage(bulkTaxValue, { min: 0, max: 100, fieldName: 'Tax percentage' })
    if (err) {
      toastError(err)
      return
    }

    const taxNum = Number(bulkTaxValue)
    setProducts((prev) =>
      prev.map((p) => {
        if (selectedIds.includes(p.id)) {
          return { ...p, taxPct: taxNum }
        }
        return p
      }),
    )

    toastSuccess(
      `Updated Tax to ${taxNum}% across ${selectedIds.length} selected items`,
    )
    setTaxDialogOpen(false)
  }

  // Filtered & Sorted items
  let filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode.includes(searchQuery)

    const matchesCat =
      selectedCategory === 'All Categories'
        ? true
        : p.category === selectedCategory

    const matchesScale =
      selectedScale === 'All Scales' ? true : p.scale === selectedScale

    return matchesSearch && matchesCat && matchesScale
  })

  // Apply Quick Presets
  if (presetFilter === 'top_selling') {
    filteredProducts = [...filteredProducts].sort(
      (a, b) => b.salesVolume30D - a.salesVolume30D,
    )
  } else if (presetFilter === 'top_profit') {
    filteredProducts = [...filteredProducts].sort(
      (a, b) => b.profitPct - a.profitPct,
    )
  } else if (presetFilter === 'top_popular') {
    filteredProducts = [...filteredProducts].sort(
      (a, b) =>
        b.salesVolume30D * b.profitPct - a.salesVolume30D * a.profitPct,
    )
  }

  return (
    <div className="space-y-6 pb-8">
      <MotionHeader>
        <PageHeader
          eyebrow="Pricing & Margin Control"
          title="Tax & Profit Management"
          description="Global wholesale margin rules, sales tax compliance, and automated multi-branch price calculations"
        />
      </MotionHeader>

      {/* Preset Filter Pills */}
      <MotionReveal delay={0.05}>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setPresetFilter('all')}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer border ${
              presetFilter === 'all'
                ? 'bg-purple-900 text-white border-purple-900 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:border-purple-200'
            }`}
          >
            All Products ({products.length})
          </button>
          <button
            type="button"
            onClick={() => setPresetFilter('top_selling')}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer border flex items-center gap-1.5 ${
              presetFilter === 'top_selling'
                ? 'bg-purple-900 text-white border-purple-900 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:border-purple-200'
            }`}
          >
            <TrendingUp className="size-3.5 text-emerald-500" />
            Most Selling Items (Top 50)
          </button>
          <button
            type="button"
            onClick={() => setPresetFilter('top_profit')}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer border flex items-center gap-1.5 ${
              presetFilter === 'top_profit'
                ? 'bg-purple-900 text-white border-purple-900 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:border-purple-200'
            }`}
          >
            <Award className="size-3.5 text-amber-500" />
            Highest Profit Margin (Top 50)
          </button>
          <button
            type="button"
            onClick={() => setPresetFilter('top_popular')}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer border flex items-center gap-1.5 ${
              presetFilter === 'top_popular'
                ? 'bg-purple-900 text-white border-purple-900 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:border-purple-200'
            }`}
          >
            <Zap className="size-3.5 text-purple-500" />
            Most Popular & High Velocity (Top 50)
          </button>
        </div>
      </MotionReveal>

      {/* Main Filter & Action Bar */}
      <MotionReveal delay={0.1}>
        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-4 shadow-2xs">
          {/* Unified Single Row Filters */}
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-12">
            {/* Search Input */}
            <div className="relative sm:col-span-6 lg:col-span-5">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by SKU ID, Product Name, or Barcode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 w-full rounded-xl border border-border bg-slate-50/70 py-2 pl-9 pr-4 text-xs sm:text-sm text-slate-900 outline-none focus:border-purple-300 focus:bg-white focus:ring-1 focus:ring-purple-300"
              />
            </div>

            {/* Category Selector */}
            <div className="sm:col-span-3 lg:col-span-3">
              <NativeSelect
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="h-10 w-full rounded-xl border-border bg-slate-50 text-xs font-medium"
              >
                {TAX_PROFIT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </NativeSelect>
            </div>

            {/* Scale Selector */}
            <div className="sm:col-span-3 lg:col-span-2">
              <NativeSelect
                value={selectedScale}
                onChange={(e) => setSelectedScale(e.target.value)}
                className="h-10 w-full rounded-xl border-border bg-slate-50 text-xs font-medium"
              >
                {TAX_PROFIT_SCALES.map((s) => (
                  <option key={s} value={s}>
                    Scale: {s}
                  </option>
                ))}
              </NativeSelect>
            </div>

            {/* Column Customizer Button */}
            <div className="relative sm:col-span-12 lg:col-span-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setColMenuOpen(!colMenuOpen)}
                className="h-10 w-full rounded-xl border-border text-xs cursor-pointer gap-1.5 font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Columns className="size-3.5 text-slate-500" />
                <span>Columns</span>
              </Button>

              {colMenuOpen && (
                <div className="absolute right-0 top-12 z-50 w-56 rounded-xl border border-border bg-white p-3 shadow-xl space-y-1.5 text-xs">
                  <span className="font-bold text-slate-700 block pb-1 border-b border-slate-100 text-[11px] uppercase tracking-wider">
                    Toggle Table Columns
                  </span>
                  {Object.keys(visibleColumns).map((colKey) => (
                    <label
                      key={colKey}
                      className="flex items-center gap-2 px-1.5 py-1 hover:bg-slate-50 rounded-lg cursor-pointer capitalize font-medium text-slate-700"
                    >
                      <input
                        type="checkbox"
                        checked={visibleColumns[colKey]}
                        onChange={(e) =>
                          setVisibleColumns({
                            ...visibleColumns,
                            [colKey]: e.target.checked,
                          })
                        }
                        className="rounded text-purple-600 focus:ring-0"
                      />
                      {colKey
                        .replace('Pct', ' %')
                        .replace('baseCost', 'Base Cost')
                        .replace('finalPrice', 'Final Price')}
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Bulk Action Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 bg-slate-50/70 p-3 rounded-xl">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleToggleSelectAll}
                className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer"
              >
                {isAllSelected ? (
                  <CheckSquare className="size-4 text-purple-700" />
                ) : (
                  <Square className="size-4 text-slate-400" />
                )}
                <span>Select All ({filteredProducts.length})</span>
              </button>
              {selectedIds.length > 0 && (
                <Badge
                  variant="outline"
                  className="bg-purple-100/70 text-purple-900 border-purple-300 text-xs font-bold px-2.5 py-0.5"
                >
                  {selectedIds.length} Selected
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                disabled={selectedIds.length === 0}
                onClick={() => setProfitDialogOpen(true)}
                size="sm"
                className="h-9 px-4 text-xs font-bold cursor-pointer text-white disabled:opacity-40 rounded-xl shadow-xs"
                style={{ background: BRAND.purple }}
              >
                <Percent className="mr-1.5 size-3.5" />
                Set Profit %
              </Button>

              <Button
                type="button"
                disabled={selectedIds.length === 0}
                onClick={() => setTaxDialogOpen(true)}
                size="sm"
                className="h-9 px-4 text-xs font-bold cursor-pointer text-white disabled:opacity-40 rounded-xl shadow-xs"
                style={{ background: BRAND.deep }}
              >
                <Calculator className="mr-1.5 size-3.5" />
                Set Tax %
              </Button>
            </div>
          </div>
        </div>
      </MotionReveal>

      {/* Pricing & Tax Table */}
      <MotionReveal delay={0.15}>
        <SurfaceCard
          title="Catalog Pricing & Profit Margins"
          description="Dynamic table calculating final retail prices from base wholesale cost, profit % and sales tax"
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[50rem] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-slate-500 uppercase">
                  <th className="w-10 px-3 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={handleToggleSelectAll}
                      className="rounded text-purple-600 focus:ring-0"
                    />
                  </th>
                  {visibleColumns.id && <th className="px-3 py-3 font-medium">SKU ID</th>}
                  {visibleColumns.image && <th className="px-3 py-3 font-medium">Image</th>}
                  {visibleColumns.name && <th className="px-3 py-3 font-medium">Product Name</th>}
                  {visibleColumns.barcode && <th className="px-3 py-3 font-medium">Barcode</th>}
                  {visibleColumns.category && <th className="px-3 py-3 font-medium">Category / Scale</th>}
                  {visibleColumns.baseCost && <th className="px-3 py-3 font-medium">Base Cost</th>}
                  {visibleColumns.profitPct && <th className="px-3 py-3 font-medium">Profit %</th>}
                  {visibleColumns.taxPct && <th className="px-3 py-3 font-medium">Tax %</th>}
                  {visibleColumns.finalPrice && (
                    <th className="px-3 py-3 text-right font-bold text-slate-900">
                      Final Price
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((p) => {
                  const isChecked = selectedIds.includes(p.id)
                  const finalPrice = calculateFinalPrice(
                    p.baseCost,
                    p.profitPct,
                    p.taxPct,
                  )

                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isChecked ? 'bg-purple-50/40' : ''
                      }`}
                    >
                      <td className="w-10 px-3 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleRow(p.id)}
                          className="rounded text-purple-600 focus:ring-0"
                        />
                      </td>

                      {visibleColumns.id && (
                        <td className="px-3 py-3 font-mono text-xs font-bold text-slate-700">
                          {p.id}
                        </td>
                      )}

                      {visibleColumns.image && (
                        <td className="px-3 py-3">
                          <img
                            src={p.image}
                            alt={p.name}
                            className="size-10 rounded-lg object-cover border border-slate-200 shadow-2xs"
                          />
                        </td>
                      )}

                      {visibleColumns.name && (
                        <td className="px-3 py-3 font-bold text-slate-900 text-xs">
                          {p.name}
                        </td>
                      )}

                      {visibleColumns.barcode && (
                        <td className="px-3 py-3 font-mono text-xs text-slate-500">
                          {p.barcode}
                        </td>
                      )}

                      {visibleColumns.category && (
                        <td className="px-3 py-3 text-xs text-slate-600">
                          <span className="block font-medium">{p.category}</span>
                          <span className="text-[10px] text-slate-400">{p.scaleLabel}</span>
                        </td>
                      )}

                      {visibleColumns.baseCost && (
                        <td className="px-3 py-3 font-semibold text-slate-800 text-xs">
                          Rs. {p.baseCost.toLocaleString()}
                        </td>
                      )}

                      {visibleColumns.profitPct && (
                        <td className="px-3 py-3">
                          <span className="inline-flex items-center font-bold text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            +{p.profitPct}%
                          </span>
                        </td>
                      )}

                      {visibleColumns.taxPct && (
                        <td className="px-3 py-3">
                          <span className="inline-flex items-center font-bold text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {p.taxPct > 0 ? `${p.taxPct}%` : '0% (Exempt)'}
                          </span>
                        </td>
                      )}

                      {visibleColumns.finalPrice && (
                        <td className="px-3 py-3 text-right">
                          <span className="font-extrabold text-sm text-purple-950 block">
                            Rs. {finalPrice.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Margin: Rs. {finalPrice - p.baseCost}
                          </span>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </SurfaceCard>
      </MotionReveal>

      {/* Set Bulk Profit Modal */}
      <Dialog open={profitDialogOpen} onOpenChange={setProfitDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Set Profit Margin Percentage</DialogTitle>
            <DialogDescription>
              Apply a standardized profit percentage to {selectedIds.length} selected items
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleApplyBulkProfit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="profitInput" className="text-xs font-semibold">
                Profit Margin (%)
              </Label>
              <Input
                id="profitInput"
                type="number"
                min="0"
                max="100"
                step="1"
                value={bulkProfitValue}
                onChange={(e) => setBulkProfitValue(e.target.value)}
                placeholder="e.g. 25"
                required
              />
              <p className="text-[11px] text-slate-500">
                Final retail price will dynamically adjust based on Base Cost + Profit % + Tax %.
              </p>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setProfitDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="text-white font-semibold"
                style={{ background: BRAND.purple }}
              >
                Apply Profit %
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Set Bulk Tax Modal */}
      <Dialog open={taxDialogOpen} onOpenChange={setTaxDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Set Sales Tax Percentage</DialogTitle>
            <DialogDescription>
              Apply tax rate or exemption to {selectedIds.length} selected items
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleApplyBulkTax} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="taxInput" className="text-xs font-semibold">
                Tax Percentage (%)
              </Label>
              <Input
                id="taxInput"
                type="number"
                min="0"
                max="100"
                step="1"
                value={bulkTaxValue}
                onChange={(e) => setBulkTaxValue(e.target.value)}
                placeholder="e.g. 5"
                required
              />
              <p className="text-[11px] text-slate-500">
                Enter 0 for tax-exempt essentials (wheat, milk, sugar).
              </p>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setTaxDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="text-white font-semibold"
                style={{ background: BRAND.deep }}
              >
                Apply Tax %
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default TaxProfitPage
