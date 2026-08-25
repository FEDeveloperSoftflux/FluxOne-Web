import { cn } from '@/lib/utils'
import { BRAND } from '@/lib/constants'

const sizes = {
  sm: 'size-9',
  md: 'size-14',
  lg: 'size-[88px]',
  xl: 'size-[min(160px,42vw)]',
}

export function BrandLogo({ className, size = 'md', withGlow = false }) {
  return (
    <div
      className={cn(
        'relative shrink-0 overflow-hidden rounded-full',
        sizes[size] || sizes.md,
        withGlow && 'shadow-[0_0_60px_rgba(142,35,143,0.55)]',
        className,
      )}
      aria-label={BRAND.name}
    >
      <img
        src="/assets/company-logo.png"
        alt={BRAND.name}
        width={160}
        height={160}
        className="size-full object-cover"
        draggable={false}
      />
    </div>
  )
}
