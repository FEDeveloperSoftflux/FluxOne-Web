import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { useAuthSession } from '@/hooks/useAuthSession'
import { BRAND, ROLES } from '@/lib/constants'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'fluxone.bm.welcomeSeen'

export function BranchWelcomeBanner({ className }) {
  const { user, role } = useAuthSession()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (role !== ROLES.BRANCH_MANAGER) return
    const company = user?.tenantName || 'your company'
    const seenKey = `${STORAGE_KEY}.${user?.tenantId || company}`
    if (localStorage.getItem(seenKey) === '1') return
    setVisible(true)
  }, [role, user?.tenantId, user?.tenantName])

  if (!visible || role !== ROLES.BRANCH_MANAGER) return null

  const company = user?.tenantName || 'your company'

  function dismiss() {
    const seenKey = `${STORAGE_KEY}.${user?.tenantId || company}`
    localStorage.setItem(seenKey, '1')
    setVisible(false)
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-border bg-white px-4 py-4 shadow-sm sm:px-5 sm:py-5',
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-1"
        style={{ background: `linear-gradient(90deg, ${BRAND.purple}, ${BRAND.deep})` }}
      />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-[0.12em] text-slate-400 uppercase">
            Welcome
          </p>
          <h2 className="mt-1 text-lg font-bold text-slate-900 sm:text-xl">
            Welcome to &ldquo;{company}&rdquo; Branch Manager Dashboard
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Manage your branch team, sales overview, and daily operations from here.
          </p>
        </div>
        <button
          type="button"
          aria-label="Dismiss welcome"
          onClick={dismiss}
          className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  )
}
