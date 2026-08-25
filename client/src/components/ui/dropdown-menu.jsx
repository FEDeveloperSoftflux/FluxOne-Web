import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

const MenuContext = createContext(null)

function DropdownMenu({ children }) {
  const [open, setOpen] = useState(false)
  return <MenuContext.Provider value={{ open, setOpen }}>{children}</MenuContext.Provider>
}

function DropdownMenuTrigger({ asChild, children, className }) {
  const ctx = useContext(MenuContext)
  return (
    <button
      type="button"
      className={cn('inline-flex', className)}
      onClick={() => ctx?.setOpen((value) => !value)}
    >
      {asChild ? children : children}
    </button>
  )
}

function DropdownMenuContent({ className, children, align = 'end' }) {
  const ctx = useContext(MenuContext)
  const ref = useRef(null)

  useEffect(() => {
    const onClick = (event) => {
      if (ref.current && !ref.current.contains(event.target)) ctx?.setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [ctx])

  if (!ctx?.open) return null

  return (
    <div
      ref={ref}
      className={cn(
        'absolute z-50 mt-2 min-w-44 rounded-md border bg-popover p-1 shadow-md',
        align === 'end' ? 'right-0' : 'left-0',
        className,
      )}
    >
      {children}
    </div>
  )
}

function DropdownMenuItem({ className, onClick, children }) {
  const ctx = useContext(MenuContext)
  return (
    <button
      type="button"
      className={cn('flex w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent', className)}
      onClick={(event) => {
        onClick?.(event)
        ctx?.setOpen(false)
      }}
    >
      {children}
    </button>
  )
}

function DropdownMenuSeparator({ className }) {
  return <div className={cn('my-1 h-px bg-border', className)} />
}

export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator }
