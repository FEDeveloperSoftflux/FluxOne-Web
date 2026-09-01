import { useState } from 'react'
import { SurfaceCard } from '@/components/shared/SurfaceCard'
import { Badge } from '@/components/ui/badge'
import { Trophy, TrendingUp, ShieldCheck, MapPin } from 'lucide-react'

const BRANCH_RANKINGS = [
  {
    rank: 1,
    name: 'Wah Cantt Branch',
    location: 'Wah Cantt, Punjab',
    manager: 'Bilal Khan',
    ytdRevenue: 'Rs. 46.85 M',
    ytdProfit: 'Rs. 16.39 M',
    profitMargin: '35.0%',
    growthRate: '+24.6%',
    status: 'Top Performer',
    statusBadge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  {
    rank: 2,
    name: 'Islamabad Flagship',
    location: 'F-7 Markaz, Islamabad',
    manager: 'Hamza Malik',
    ytdRevenue: 'Rs. 33.70 M',
    ytdProfit: 'Rs. 11.79 M',
    profitMargin: '35.0%',
    growthRate: '+28.2%',
    status: 'Fastest Growing',
    statusBadge: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  {
    rank: 3,
    name: 'Haripur Branch',
    location: 'Main Bazar, Haripur',
    manager: 'Sara Ahmed',
    ytdRevenue: 'Rs. 29.85 M',
    ytdProfit: 'Rs. 10.15 M',
    profitMargin: '34.0%',
    growthRate: '+16.8%',
    status: 'Stable Profit',
    statusBadge: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  {
    rank: 4,
    name: 'Taxilla Branch',
    location: 'GT Road, Taxilla',
    manager: 'Omar Sheikh',
    ytdRevenue: 'Rs. 25.10 M',
    ytdProfit: 'Rs. 8.78 M',
    profitMargin: '35.0%',
    growthRate: '+14.2%',
    status: 'Steady',
    statusBadge: 'bg-slate-100 text-slate-700 border-slate-200',
  },
]

export function BranchPerformanceRanking() {
  return (
    <SurfaceCard
      title="Branch Performance Ranking (YTD 2026)"
      description="Consolidated financial leaderboard ranking branches by revenue, profit generation & operational efficiency"
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[36rem] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-slate-500 uppercase tracking-wide">
              <th className="px-3 py-2.5 font-medium">Rank</th>
              <th className="px-3 py-2.5 font-medium">Branch Details</th>
              <th className="px-3 py-2.5 font-medium">YTD Revenue</th>
              <th className="px-3 py-2.5 font-medium">YTD Net Profit</th>
              <th className="px-3 py-2.5 font-medium">Profit Margin</th>
              <th className="px-3 py-2.5 text-right font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {BRANCH_RANKINGS.map((b) => (
              <tr
                key={b.rank}
                className="border-b border-border/70 hover:bg-slate-50/80 transition-colors"
              >
                <td className="px-3 py-3">
                  <span
                    className={`flex size-6 items-center justify-center rounded-full text-xs font-bold ${
                      b.rank === 1
                        ? 'bg-amber-100 text-amber-800'
                        : b.rank === 2
                        ? 'bg-slate-200 text-slate-800'
                        : b.rank === 3
                        ? 'bg-amber-800/10 text-amber-900'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {b.rank === 1 ? <Trophy className="size-3 text-amber-600" /> : b.rank}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <div className="font-bold text-slate-900">{b.name}</div>
                  <div className="text-xs text-slate-500 flex items-center gap-1">
                    <MapPin className="size-3 text-slate-400" /> {b.location} · Mgr: {b.manager}
                  </div>
                </td>
                <td className="px-3 py-3 font-semibold text-slate-900">{b.ytdRevenue}</td>
                <td className="px-3 py-3 font-bold text-purple-900">{b.ytdProfit}</td>
                <td className="px-3 py-3 text-emerald-700 font-semibold">{b.profitMargin}</td>
                <td className="px-3 py-3 text-right">
                  <Badge variant="outline" className={b.statusBadge}>
                    {b.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SurfaceCard>
  )
}
export default BranchPerformanceRanking
