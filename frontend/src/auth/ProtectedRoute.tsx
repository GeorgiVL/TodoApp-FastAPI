import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './AuthContext'

// Gate for routes that require a logged-in user; bounces to /login otherwise.
export default function ProtectedRoute() {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <Outlet />
}
