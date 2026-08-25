import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BRAND } from '@/lib/constants'

/**
 * Edit name + User ID (login) only.
 */
export function ProfileEditDialog({
  open,
  onOpenChange,
  initialName = '',
  initialLoginId = '',
  onSubmit,
  loading = false,
}) {
  const [name, setName] = useState('')
  const [loginId, setLoginId] = useState('')
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!open) return
    setName(initialName || '')
    setLoginId(initialLoginId || '')
    setError(null)
  }, [open, initialName, initialLoginId])

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)

    const nextName = name.trim()
    const nextId = loginId.trim()
    if (!nextName) {
      setError('Name is required')
      return
    }
    if (!nextId || nextId.length < 3) {
      setError('User ID must be at least 3 characters')
      return
    }

    const result = await onSubmit?.({ name: nextName, id: nextId })
    if (result && result.success === false) {
      setError(result.error || 'Update failed')
      return
    }
    onOpenChange?.(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>
            Update your display name and login User ID. Role cannot be changed here.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <Label htmlFor="profile-name">Name</Label>
            <Input
              id="profile-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              autoComplete="name"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="profile-login-id">User ID</Label>
            <Input
              id="profile-login-id"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              placeholder="Login ID"
              autoComplete="username"
            />
            <p className="text-xs text-slate-500">Used with your password at login.</p>
          </div>

          {error ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-100">
              {error}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              className="w-full sm:w-auto"
              onClick={() => onOpenChange?.(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              style={{ background: BRAND.purple }}
              className="w-full text-white hover:opacity-90 sm:w-auto"
            >
              {loading ? 'Saving…' : 'Save changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
