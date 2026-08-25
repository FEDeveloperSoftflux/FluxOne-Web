import { cn } from '@/lib/utils'
import { BRAND } from '@/lib/constants'

export function TaxMultiSelect({ taxes = [], value = [], onChange, className }) {
  const selected = new Set(value)

  function toggle(id) {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    onChange?.([...next])
  }

  if (!taxes.length) {
    return <p className="text-xs text-slate-400">No taxes configured for this company.</p>
  }

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {taxes.map((tax) => {
        const active = selected.has(tax.id)
        return (
          <button
            key={tax.id}
            type="button"
            onClick={() => toggle(tax.id)}
            className={cn(
              'cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              active
                ? 'border-transparent text-white'
                : 'border-border bg-white text-slate-700 hover:bg-slate-50',
            )}
            style={active ? { background: BRAND.purple } : undefined}
          >
            {tax.name}
            {tax.ratePercent != null ? ` (${tax.ratePercent}%)` : ''}
          </button>
        )
      })}
    </div>
  )
}
