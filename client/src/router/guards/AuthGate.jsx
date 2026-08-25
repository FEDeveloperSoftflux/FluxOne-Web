import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthSession } from '@/hooks/useAuthSession'
import { PATHS } from '@/router/paths'

export function AuthGate() {
  const { isAuthenticated } = useAuthSession()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to={PATHS.login} replace state={{ from: location }} />
  }

  return <Outlet />
}
