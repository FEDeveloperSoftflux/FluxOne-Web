import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BrandLogo } from '@/components/shared/BrandLogo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthSession } from '@/hooks/useAuthSession'
import { BRAND, DEMO_ACCOUNTS } from '@/lib/constants'
import { clearAuthError } from '@/rtk/features/auth/authSlice'
import { useAppDispatch } from '@/rtk/hooks'
import { homePathForRole } from '@/router/paths'

export function LoginForm() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { login, status, error } = useAuthSession()
  const [id, setId] = useState('')
  const [password, setPassword] = useState('')
  const [localError, setLocalError] = useState('')
  const loading = status === 'loading'
  const displayError = localError || error

  function clearErrors() {
    setLocalError('')
    dispatch(clearAuthError())
  }

  function fillDemo(account) {
    setId(account.id)
    setPassword(account.password)
    clearErrors()
  }

  async function onSubmit(event) {
    event.preventDefault()
    clearErrors()

    const loginId = id.trim()
    if (!loginId) {
      setLocalError('User ID is required')
      return
    }
    if (!password || password.length < 8) {
      setLocalError('Password must be at least 8 characters')
      return
    }

    try {
      const data = await login({ id: loginId, password })
      navigate(homePathForRole(data?.user?.role), { replace: true })
    } catch (err) {
      const message =
        typeof err === 'string'
          ? err
          : err?.payload || err?.message || err?.error || 'Login failed'
      setLocalError(message)
    }
  }

  return (
    <div className="flex flex-col items-center">
      <BrandLogo size="lg" className="mb-5" />
      <h1 className="text-center text-xl font-bold tracking-tight text-foreground sm:text-2xl">FluxOne Login</h1>
      <p className="mt-1 text-center text-sm text-muted-foreground">Sign in with your User ID and password</p>
      <form className="mt-6 w-full space-y-4" onSubmit={onSubmit} noValidate>
        <div className="space-y-2">
          <Label htmlFor="login-id" className="font-semibold">
            User ID
          </Label>
          <Input
            id="login-id"
            name="id"
            autoComplete="username"
            placeholder="e.g. branch.wah@companya.local"
            value={id}
            disabled={loading}
            onChange={(event) => {
              setId(event.target.value)
              clearErrors()
            }}
            className="h-11 rounded-lg"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="login-password" className="font-semibold">
            Password
          </Label>
          <Input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="Enter password"
            value={password}
            disabled={loading}
            onChange={(event) => {
              setPassword(event.target.value)
              clearErrors()
            }}
            className="h-11 rounded-lg"
          />
        </div>

        {displayError ? (
          <p
            role="alert"
            className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {displayError}
          </p>
        ) : null}

        <Button
          type="submit"
          disabled={loading}
          className="h-11 w-full rounded-lg text-base font-semibold text-white shadow-md cursor-pointer"
          style={{ background: `linear-gradient(90deg, ${BRAND.purple}, ${BRAND.deep})` }}
        >
          {loading ? 'Signing in…' : 'Login'}
        </Button>

        <div className="rounded-lg border border-border bg-muted/40 p-3">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Demo credentials
          </p>
          <ul className="mt-2 max-h-40 space-y-1.5 overflow-y-auto">
            {DEMO_ACCOUNTS.map((account) => (
              <li key={`${account.tenantSlug}-${account.id}`}>
                <button
                  type="button"
                  onClick={() => fillDemo(account)}
                  className="w-full rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-white"
                >
                  <span className="font-medium text-foreground">
                    {account.label}
                    <span className="ml-1 font-normal text-muted-foreground">
                      ({account.tenantSlug === 'company-a' ? 'Company A' : 'Company B'})
                    </span>
                  </span>
                  <span className="mt-0.5 block truncate text-muted-foreground">{account.id}</span>
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] text-muted-foreground">Password for all demos: password</p>
        </div>
      </form>
    </div>
  )
}
