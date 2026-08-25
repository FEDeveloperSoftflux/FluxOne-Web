import { useAuth } from '@/context/AuthContext'

export function useAuthSession() {
  const auth = useAuth()
  return {
    user: auth.user,
    role: auth.role,
    token: auth.token,
    isAuthenticated: auth.isAuthenticated,
    status: auth.status,
    error: auth.error,
    login: auth.login,
    logout: auth.logout,
  }
}
