import { BranchKpiCards } from '@/components/feature/branch/dashboard/BranchKpiCards'
import { BranchWelcomeBanner } from '@/components/feature/branch/dashboard/BranchWelcomeBanner'
import { InventoryStatusChart } from '@/components/feature/branch/dashboard/InventoryStatusChart'
import { ProductSalesInsights } from '@/components/feature/branch/dashboard/ProductSalesInsights'
import { SalesChart } from '@/components/feature/branch/dashboard/SalesChart'
import { StaffPerformanceTable } from '@/components/feature/branch/dashboard/StaffPerformanceTable'
import { MotionHeader, MotionReveal } from '@/components/shared/MotionReveal'
import { PageHeader } from '@/components/shared/PageHeader'
import { useBranchDashboard } from '@/hooks/useBranchDashboard'
import { BRAND } from '@/lib/constants'
import { cn } from '@/lib/utils'

export function DashboardPage() {
  const { data, date, setDate, loading, source } = useBranchDashboard()

  return (
    <div className="space-y-5 pb-8 sm:space-y-6">
      <MotionHeader>
        <PageHeader
          eyebrow="Branch Overview"
          title="Branch Dashboard"
          description="Sales, profit, staff & inventory for the selected date"
          actions={
            <>
              {source === 'dummy' ? (
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-200">
                  Demo data
                </span>
              ) : null}
              <label className="flex w-full items-center gap-2 rounded-xl border border-border bg-white px-3 py-2 text-sm shadow-sm sm:w-auto">
                <span className="shrink-0 text-slate-500">Date</span>
                <input
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  className="min-w-0 flex-1 border-0 bg-transparent font-semibold text-slate-800 outline-none sm:flex-none"
                />
              </label>
            </>
          }
        />
      </MotionHeader>

      <BranchWelcomeBanner />

      <div
        className={cn(
          'space-y-5 transition-opacity duration-300 sm:space-y-6',
          loading && 'opacity-60',
        )}
      >
        <BranchKpiCards kpis={data.kpis} />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 lg:gap-6">
          <MotionReveal delay={0.05}>
            <SalesChart series={data.salesByHour} />
          </MotionReveal>
          <MotionReveal delay={0.1}>
            <ProductSalesInsights
              productMix={data.productMix}
              topProducts={data.topProducts}
              lowProducts={data.lowProducts}
            />
          </MotionReveal>
        </div>

        <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-2 xl:gap-6">
          <MotionReveal delay={0.12}>
            <StaffPerformanceTable staff={data.staff} />
          </MotionReveal>
          <MotionReveal delay={0.16}>
            <InventoryStatusChart inventory={data.inventory} />
          </MotionReveal>
        </div>
      </div>

      <p className="text-center text-[11px] text-slate-400">
        Accent · <span style={{ color: BRAND.purple }}>FluxOne</span> branch analytics
      </p>
    </div>
  )
}

export default DashboardPage