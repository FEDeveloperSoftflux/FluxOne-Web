import { createContext, useContext } from 'react'
import { cn } from '@/lib/utils'

const DialogContext = createContext(null)

function Dialog({ open, onOpenChange, children }) {
  return <DialogContext.Provider value={{ open, onOpenChange }}>{children}</DialogContext.Provider>
}

function DialogTrigger({ asChild, children, className, ...props }) {
  const ctx = useContext(DialogContext)
  if (asChild) {
    return (
      <span className={className} onClick={() => ctx?.onOpenChange?.(true)} {...props}>
        {children}
      </span>
    )
  }
  return (
    <button type="button" className={className} onClick={() => ctx?.onOpenChange?.(true)} {...props}>
      {children}
    </button>
  )
}

function DialogContent({ className, children }) {
  const ctx = useContext(DialogContext)
  if (!ctx?.open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close dialog"
        onClick={() => ctx.onOpenChange(false)}
      />
      <div
        className={cn(
          'relative z-10 max-h-[90dvh] w-full overflow-y-auto rounded-t-2xl border bg-card p-5 shadow-lg sm:max-w-lg sm:rounded-xl sm:p-6',
          className,
        )}
      >
        {children}
      </div>
    </div>
  )
}

function DialogHeader({ className, ...props }) {
  return <div className={cn('mb-4 space-y-1', className)} {...props} />
}

function DialogTitle({ className, ...props }) {
  return <h2 className={cn('text-lg font-semibold', className)} {...props} />
}

function DialogDescription({ className, ...props }) {
  return <p className={cn('text-sm text-muted-foreground', className)} {...props} />
}

function DialogFooter({ className, ...props }) {
  return (
    <div
      className={cn(
        'mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end',
        className,
      )}
      {...props}
    />
  )
}

export { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter }
