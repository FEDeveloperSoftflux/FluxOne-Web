import { cn } from '@/lib/utils'

function Checkbox({ className, ...props }) {
  return (
    <input
      type="checkbox"
      className={cn('h-4 w-4 rounded border-input text-primary accent-primary', className)}
      {...props}
    />
  )
}

export { Checkbox }
