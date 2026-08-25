import { Navigate, Outlet } from 'react-router-dom'
import { usePermissions } from '@/hooks/usePermissions'
import { PATHS } from '@/router/paths'

export function PermissionGate({ permission }) {
  const { can } = usePermissions()

  if (permission && !can(permission)) {
    return <Navigate to={PATHS.inventory.dashboard} replace />
  }

  return <Outlet />
}
