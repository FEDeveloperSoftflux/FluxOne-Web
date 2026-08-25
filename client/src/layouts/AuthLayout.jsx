import { BRAND } from '@/lib/constants'

export function AuthLayout({ children }) {
  return (
    <section
      className="flex min-h-dvh items-center justify-center px-3 py-6 sm:px-4 sm:py-10"
      style={{
        background: `linear-gradient(165deg, ${BRAND.soft} 0%, #ebe4f8 45%, #e8eefc 100%)`,
      }}
    >
      <div className="w-full max-w-[420px] rounded-2xl border border-white/80 bg-white p-5 shadow-[0_18px_50px_rgba(65,34,131,0.12)] sm:p-8">
        {children}
      </div>
    </section>
  )
}
