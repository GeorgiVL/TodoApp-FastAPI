import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { registerUser, login as apiLogin, refreshToken as apiRefresh } from '../api/auth'
import { clearToken, getToken, setUnauthorizedHandler } from '../api/client'
import type { JwtPayload, RegisterInput } from '../types'

export interface AuthUser {
  username: string
  id: number
  role: string
}

interface AuthContextValue {
  user: AuthUser | null
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<void>
  register: (input: RegisterInput) => Promise<void>
  refreshSession: () => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

// Decode a JWT payload without verifying the signature (display only — the server still
// enforces auth on every request).
function decodeJwt(token: string): JwtPayload | null {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(base64)) as JwtPayload
  } catch {
    return null
  }
}

function userFromToken(token: string | null): AuthUser | null {
  if (!token) return null
  const payload = decodeJwt(token)
  if (!payload) return null
  // Treat an expired token as logged out.
  if (typeof payload.exp === 'number' && payload.exp * 1000 < Date.now()) return null
  return { username: payload.sub, id: payload.id, role: payload.role }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => userFromToken(getToken()))

  const logout = useCallback(() => {
    clearToken()
    setUser(null)
  }, [])

  // Let the API client log us out when any authenticated call returns 401.
  useEffect(() => {
    setUnauthorizedHandler(logout)
    return () => setUnauthorizedHandler(null)
  }, [logout])

  const login = useCallback(async (username: string, password: string) => {
    const token = await apiLogin(username, password)
    setUser(userFromToken(token))
  }, [])

  const register = useCallback(async (input: RegisterInput) => {
    await registerUser(input)
    // Smooth onboarding: log the new user straight in.
    await login(input.username, input.password)
  }, [login])

  const refreshSession = useCallback(async () => {
    const token = await apiRefresh()
    setUser(userFromToken(token))
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ user, isAuthenticated: user !== null, login, register, refreshSession, logout }),
    [user, login, register, refreshSession, logout],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
