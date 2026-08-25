import { BRAND } from '@/lib/constants'
import { PRODUCT_STATUS } from '@/lib/mapProduct'
import { cn } from '@/lib/utils'

export function ProductStatusToggle({ status, loading = false, onChange, className }) {
  const isActive = status !== PRODUCT_STATUS.INACTIVE && status !== 'close'

  return (
    <button
      type="button"
      disabled={loading}
      onClick={() => onChange?.(isActive ? PRODUCT_STATUS.INACTIVE : PRODUCT_STATUS.ACTIVE)}
      className={cn(
        'inline-flex cursor-pointer items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 transition-opacity disabled:cursor-not-allowed disabled:opacity-60',
        isActive
          ? 'bg-emerald-50 text-emerald-800 ring-emerald-100'
          : 'bg-slate-100 text-slate-600 ring-slate-200',
        className,
      )}
      title={isActive ? 'Click to deactivate' : 'Click to activate'}
    >
      <span
        className="mr-1.5 size-1.5 rounded-full"
        style={{ background: isActive ? '#22c55e' : '#94a3b8' }}
      />
      {isActive ? 'Active' : 'Inactive'}
      {loading ? '…' : ''}
    </button>
  )
}

export function ProductImageCell({ src, name }) {
  if (src) {
    return (
      <img
        src={src}
        alt={name || ''}
        className="size-10 rounded-lg object-cover ring-1 ring-border"
      />
    )
  }
  return (
    <div
      className="flex size-10 items-center justify-center rounded-lg text-xs font-bold text-white"
      style={{ background: `linear-gradient(145deg, ${BRAND.purple}, ${BRAND.deep})` }}
    >
      {(name || '?').slice(0, 1).toUpperCase()}
    </div>
  )
}
