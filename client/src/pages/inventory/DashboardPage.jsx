import { useEffect, useRef } from 'react'
import { InventoryKpiCards } from '@/components/feature/dashboard/InventoryKpiCards'
import { StockAlertsTable } from '@/components/feature/dashboard/StockAlertsTable'
import { StockOutChart } from '@/components/feature/dashboard/StockOutChart'
import { MotionHeader, MotionReveal } from '@/components/shared/MotionReveal'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { useAuthSession } from '@/hooks/useAuthSession'
import { useInventoryDashboard } from '@/hooks/useInventoryDashboard'
import { toastError } from '@/lib/toast'
import { cn } from '@/lib/utils'

export function DashboardPage() {
  const { user } = useAuthSession()
  const name = user?.name || user?.fullName || 'Inventory Manager'
  const {
    kpis,
    alerts,
    alertsPagination,
    stockOutPie,
    setAlertsPage,
    loading,
    alertsLoading,
    error,
    reload,
  } = useInventoryDashboard()

  const lastErrorRef = useRef(null)
  useEffect(() => {
    if (error && error !== lastErrorRef.current) {
      lastErrorRef.current = error
      toastError(error)
    }
    if (!error) lastErrorRef.current = null
  }, [error])

  return (
    <div className="space-y-5 pb-8 sm:space-y-6">
      <MotionHeader>
        <PageHeader
          eyebrow="Inventory"
          title="Inventory Overview"
          description={`Hi ${name} — categories, stock alerts, and top stock-out movers.`}
          actions={
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={loading}
              onClick={reload}
              className="w-full cursor-pointer sm:w-auto"
            >
              Refresh
            </Button>
          }
        />
      </MotionHeader>

      <div className="space-y-5 sm:space-y-6">
        <MotionReveal delay={0.04}>
          <div className={cn(loading && 'opacity-60 transition-opacity')}>
            <p className="mb-3 text-xs font-semibold tracking-[0.12em] text-slate-400 uppercase">
              Inventory overview KPIs
            </p>
            <InventoryKpiCards kpis={kpis} loading={loading} />
          </div>
        </MotionReveal>

        <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-2 xl:gap-6">
          <MotionReveal delay={0.08}>
            <div className={cn(alertsLoading && 'opacity-60 transition-opacity')}>
              <StockAlertsTable
                items={alerts}
                loading={alertsLoading || loading}
                pagination={alertsPagination}
                onPageChange={setAlertsPage}
              />
            </div>
          </MotionReveal>
          <MotionReveal delay={0.1}>
            <div className={cn(loading && 'opacity-60 transition-opacity')}>
              <StockOutChart items={stockOutPie} loading={loading} />
            </div>
          </MotionReveal>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
