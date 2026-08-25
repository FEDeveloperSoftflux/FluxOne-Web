import { createContext, useContext, useId, useState } from 'react'
import { cn } from '@/lib/utils'

const TabsContext = createContext(null)

function Tabs({ defaultValue, value: controlled, onValueChange, className, children }) {
  const [uncontrolled, setUncontrolled] = useState(defaultValue)
  const value = controlled ?? uncontrolled
  const setValue = onValueChange ?? setUncontrolled

  return (
    <TabsContext.Provider value={{ value, setValue }}>
      <div className={cn('w-full', className)}>{children}</div>
    </TabsContext.Provider>
  )
}

function TabsList({ className, ...props }) {
  return (
    <div
      className={cn('inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground', className)}
      {...props}
    />
  )
}

function TabsTrigger({ value, className, children }) {
  const ctx = useContext(TabsContext)
  const active = ctx?.value === value
  const id = useId()

  return (
    <button
      id={id}
      type="button"
      className={cn(
        'inline-flex items-center justify-center rounded-sm px-3 py-1.5 text-sm font-medium transition-all',
        active ? 'bg-background text-foreground shadow-sm' : 'hover:text-foreground',
        className,
      )}
      onClick={() => ctx?.setValue(value)}
    >
      {children}
    </button>
  )
}

function TabsContent({ value, className, children }) {
  const ctx = useContext(TabsContext)
  if (ctx?.value !== value) return null
  return <div className={cn('mt-4', className)}>{children}</div>
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
