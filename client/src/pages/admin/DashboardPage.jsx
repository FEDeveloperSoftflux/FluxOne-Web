import { useState } from 'react'
import { MotionHeader, MotionReveal } from '@/components/shared/MotionReveal'
import { PageHeader } from '@/components/shared/PageHeader'
import { AdminWelcomeBanner } from '@/components/feature/admin/dashboard/AdminWelcomeBanner'
import { AdminKpiCards } from '@/components/feature/admin/dashboard/AdminKpiCards'
import { BranchProfitOverviewChart } from '@/components/feature/admin/dashboard/BranchProfitOverviewChart'
import { BranchInventoryStatusChart } from '@/components/feature/admin/dashboard/BranchInventoryStatusChart'
import { AiBusinessInsights } from '@/components/feature/admin/dashboard/AiBusinessInsights'
import { ADMIN_DASHBOARD_DATA } from '@/data/adminDashboardMock'
import { BRAND } from '@/lib/constants'
import { NativeSelect } from '@/components/ui/select'

export function DashboardPage() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedBranch, setSelectedBranch] = useState('all')
  const [data] = useState(ADMIN_DASHBOARD_DATA)

  return (
    <div className="space-y-5 pb-8 sm:space-y-6">
      <MotionHeader>
        <PageHeader
          eyebrow="B2B Admin Overview"
          title="Admin Dashboard"
          description="Consolidated sales, profit, branch inventory & business insights"
          actions={
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              <label className="flex w-full items-center gap-2 rounded-xl border border-border bg-white px-3 py-2 text-sm shadow-sm sm:w-auto">
                <span className="shrink-0 text-slate-500">Branch</span>
                <NativeSelect
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="h-7 border-0 bg-transparent py-0 text-xs font-semibold text-slate-800 shadow-none focus:ring-0"
                >
                  <option value="all">All Branches</option>
                  <option value="wah">Wah Cantt</option>
                  <option value="haripur">Haripur</option>
                  <option value="taxilla">Taxilla</option>
                  <option value="islamabad">Islamabad</option>
                </NativeSelect>
              </label>

              <label className="flex w-full items-center gap-2 rounded-xl border border-border bg-white px-3 py-2 text-sm shadow-sm sm:w-auto">
                <span className="shrink-0 text-slate-500">Date</span>
                <input
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  className="min-w-0 flex-1 border-0 bg-transparent font-semibold text-slate-800 outline-none sm:flex-none"
                />
              </label>
            </div>
          }
        />
      </MotionHeader>

      <AdminWelcomeBanner />

      <div className="space-y-5 sm:space-y-6">
        {/* 1. KPIs (Today Earning, Last month Earning, This year Earning, Total Sale) */}
        <AdminKpiCards kpis={data.kpis} />

        {/* 2. Branch Overview (Graphical representation based on month and profit for current year) */}
        <MotionReveal delay={0.05}>
          <BranchProfitOverviewChart data={data.branchProfitOverview} />
        </MotionReveal>

        {/* 3. Branch Inventory Status (Graphical representation today each branch status) */}
        <MotionReveal delay={0.1}>
          <BranchInventoryStatusChart data={data.branchInventoryStatus} />
        </MotionReveal>

        {/* 4. AI Business Insights (Tomorrow sales aspect, best products based on 7 days, why sales rise/drop) */}
        <MotionReveal delay={0.15}>
          <AiBusinessInsights insights={data.aiBusinessInsights} />
        </MotionReveal>
      </div>

      <p className="text-center text-[11px] text-slate-400">
        Accent · <span style={{ color: BRAND.purple }}>FluxOne</span> enterprise analytics
      </p>
    </div>
  )
}

export default DashboardPage
