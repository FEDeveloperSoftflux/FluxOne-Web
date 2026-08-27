// Phase 2 placeholder — Production / Delivery staff land here after login
import { Construction } from 'lucide-react'
import { MotionHeader, MotionReveal } from '@/components/shared/MotionReveal'
import { SurfaceCard } from '@/components/shared/SurfaceCard'
import { useAuthSession } from '@/hooks/useAuthSession'
import { BRAND } from '@/lib/constants'
import { roleDisplayName } from '@/lib/nav'

export function ComingSoonPage() {
  const { user, role } = useAuthSession()
  const name = user?.name || user?.fullName || 'there'
  const roleLabel = roleDisplayName(role)

  return (
    <div className="space-y-6">
      <MotionHeader>
        <p className="text-sm font-medium text-slate-500">Welcome, {name}</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Your workspace is almost ready
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600">
          The {roleLabel} tools are part of Phase 2. We’re polishing this experience for
          your team — check back soon.
        </p>
      </MotionHeader>

      <MotionReveal>
        <SurfaceCard
          title="Phase 2 in progress"
          description="You can still manage your profile or sign out from the menu above."
        >
          <div className="flex flex-col items-center gap-4 py-8 text-center sm:py-10">
            <div
              className="flex size-14 items-center justify-center rounded-2xl text-white"
              style={{ background: `linear-gradient(145deg, ${BRAND.purple}, ${BRAND.deep})` }}
            >
              <Construction className="size-7" aria-hidden />
            </div>
            <div className="max-w-md space-y-2">
              <p className="text-base font-semibold text-slate-900">
                Thanks for your patience
              </p>
              <p className="text-sm leading-relaxed text-slate-600">
                Production kitchen flows, delivery routes, and related dashboards will
                appear here when Phase 2 ships. Nothing is broken — this account is ready
                and waiting for those modules.
              </p>
            </div>
          </div>
        </SurfaceCard>
      </MotionReveal>
    </div>
  )
}
