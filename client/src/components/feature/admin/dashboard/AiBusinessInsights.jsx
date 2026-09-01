import { SurfaceCard } from '@/components/shared/SurfaceCard'
import { Badge } from '@/components/ui/badge'
import { BRAND } from '@/lib/constants'
import {
  Sparkles,
  TrendingUp,
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Sun,
  Calendar,
  Layers,
  Brain,
  Zap,
} from 'lucide-react'

export function AiBusinessInsights() {
  return (
    <SurfaceCard
      title={
        <div className="flex items-center gap-2.5">
          <div
            className="flex size-7 items-center justify-center rounded-lg text-white shadow-xs"
            style={{ background: `linear-gradient(135deg, ${BRAND.purple}, ${BRAND.deep})` }}
          >
            <Sparkles className="size-4" />
          </div>
          <span className="text-base sm:text-lg font-bold text-slate-900">
            AI Business Insights
          </span>
        </div>
      }
      description="Predictive sales aspects, best-selling product forecasts & trend causality analysis"
      actions={
        <Badge
          variant="outline"
          className="bg-purple-50 text-purple-900 border-purple-200 text-xs font-bold"
        >
          Phase 2 Feature
        </Badge>
      }
    >
      <div className="flex flex-col items-center justify-center py-10 px-4 text-center rounded-2xl border border-dashed border-purple-200 bg-[#fbf5fc]/60">
        <div
          className="flex size-14 items-center justify-center rounded-2xl text-white shadow-sm mb-4"
          style={{ background: `linear-gradient(135deg, ${BRAND.purple}, ${BRAND.deep})` }}
        >
          <Brain className="size-7" />
        </div>

        <h4 className="text-lg font-bold text-slate-900">
          AI Business Insights Engine (Phase 2)
        </h4>

        <p className="mt-2 max-w-xl text-xs sm:text-sm text-slate-600 leading-relaxed">
          AI predictive analytics will connect with deep-learning branch telemetry in <strong>Phase 2</strong> to forecast tomorrow&apos;s sales, identify best-selling products based on 7-day velocity, and explain reasons behind sales rises and drops.
        </p>

        {/* 3 Pillar Wireframe Cards */}
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3 max-w-3xl w-full text-left">
          {/* Pillar 1 */}
          <div className="rounded-xl border border-purple-100 bg-white p-4 shadow-2xs hover:border-purple-200 transition-all">
            <div className="flex items-center gap-2 text-purple-900 font-bold text-xs mb-1.5">
              <TrendingUp className="size-4 text-purple-700" />
              <span>Tomorrow Sales Aspect</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              AI will explain and show tomorrow&apos;s all sales aspects and revenue projections based on prior days&apos; data.
            </p>
            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-semibold text-purple-800">
              <span>Expected Range & Volume</span>
              <Badge variant="outline" className="text-[9px] h-4 bg-purple-50 text-purple-700 border-purple-200">
                Phase 2
              </Badge>
            </div>
          </div>

          {/* Pillar 2 */}
          <div className="rounded-xl border border-purple-100 bg-white p-4 shadow-2xs hover:border-purple-200 transition-all">
            <div className="flex items-center gap-2 text-purple-900 font-bold text-xs mb-1.5">
              <ShoppingBag className="size-4 text-purple-700" />
              <span>Best-Selling Items (7-Day)</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              AI will explain which products are expected to give the best sales tomorrow based on the last 7 days of historical velocity.
            </p>
            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-semibold text-purple-800">
              <span>Top SKU Demand Forecast</span>
              <Badge variant="outline" className="text-[9px] h-4 bg-purple-50 text-purple-700 border-purple-200">
                Phase 2
              </Badge>
            </div>
          </div>

          {/* Pillar 3 */}
          <div className="rounded-xl border border-purple-100 bg-white p-4 shadow-2xs hover:border-purple-200 transition-all">
            <div className="flex items-center gap-2 text-purple-900 font-bold text-xs mb-1.5">
              <Zap className="size-4 text-purple-700" />
              <span>Why Sales Rise or Drop</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              AI will explain why sales go high or low based on upcoming calendar events, market days, holidays, and stock factors.
            </p>
            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-semibold text-purple-800">
              <span>Causality & Event Triggers</span>
              <Badge variant="outline" className="text-[9px] h-4 bg-purple-50 text-purple-700 border-purple-200">
                Phase 2
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </SurfaceCard>
  )
}

export default AiBusinessInsights
