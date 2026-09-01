import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { isAdminLoggedIn } from '@/config/adminAuth.config'
import { PATHS } from '@/router/paths'

export function AdminAuthGate() {
  const location = useLocation()
  const authenticated = isAdminLoggedIn()

  if (!authenticated) {
    return <Navigate to={PATHS.login} state={{ from: location }} replace />
  }

  return <Outlet />
}
export default AdminAuthGate
