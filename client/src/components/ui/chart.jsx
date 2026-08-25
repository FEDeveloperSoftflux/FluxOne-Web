import { ResponsiveContainer } from 'recharts'
import { cn } from '@/lib/utils'

function ChartContainer({ className, children }) {
  return (
    <div className={cn('h-64 w-full', className)}>
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  )
}

export { ChartContainer }
