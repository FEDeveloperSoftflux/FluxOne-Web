import { createContext, useContext, useEffect, useMemo } from 'react'
import { useAppDispatch, useAppSelector } from '@/rtk/hooks'
import { fetchCurrentUser, loginUser, logoutUser } from '@/rtk/features/auth/authSlice'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const dispatch = useAppDispatch()
  const auth = useAppSelector((state) => state.auth)

  useEffect(() => {
    if (!auth.token || !auth.isAuthenticated) return
    void dispatch(fetchCurrentUser())
  }, [dispatch, auth.token, auth.isAuthenticated])

  const value = useMemo(
    () => ({
      ...auth,
      login: (credentials) => dispatch(loginUser(credentials)).unwrap(),
      logout: () => dispatch(logoutUser()),
    }),
    [auth, dispatch],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
