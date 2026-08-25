import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BrandLogo } from '@/components/shared/BrandLogo'
import { BRAND } from '@/lib/constants'
import { PATHS } from '@/router/paths'

export function SplashPage() {
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate(PATHS.login, { replace: true })
    }, 2600)
    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <section
      className="flex min-h-dvh items-center justify-center overflow-hidden"
      style={{
        background: `linear-gradient(160deg, ${BRAND.deep} 0%, ${BRAND.purple} 55%, #2a1658 100%)`,
      }}
    >
      <div className="text-center">
        <BrandLogo size="xl" withGlow className="mx-auto" />
        <p className="mt-5 text-sm tracking-[0.12em] text-white/90 uppercase">{BRAND.product}</p>
        <p className="mt-3 text-xs text-white/50">{BRAND.name}</p>
      </div>
    </section>
  )
}
