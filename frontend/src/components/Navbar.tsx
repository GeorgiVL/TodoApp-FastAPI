import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import HealthBadge from './HealthBadge'

export default function Navbar() {
  const { user, logout } = useAuth()

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="brand">✓ TodoApp</Link>
        {user && (
          <div className="navbar-user">
            <HealthBadge />
            <nav className="navbar-links">
              <Link to="/">Todos</Link>
              <Link to="/profile">Profile</Link>
              {user.role === 'admin' && <Link to="/admin">Admin</Link>}
            </nav>
            <span className="greeting">
              Hi, <strong>{user.username}</strong>
            </span>
            <button type="button" className="btn btn-ghost" onClick={logout}>
              Log out
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
