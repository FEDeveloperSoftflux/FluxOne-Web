import { Bell } from 'lucide-react'
import { cn } from '@/lib/utils'

export function NotificationBell({ hasUnread = true, className, onClick }) {
  return (
    <button
      type="button"
      aria-label="Notifications"
      onClick={onClick}
      className={cn(
        'relative flex size-10 items-center justify-center rounded-xl border border-border bg-white text-slate-600 transition-colors hover:bg-slate-50',
        className,
      )}
    >
      <Bell className="size-5" strokeWidth={1.75} />
      {hasUnread ? (
        <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-red-500 ring-2 ring-white" />
      ) : null}
    </button>
  )
}
