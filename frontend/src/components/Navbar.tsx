import { useAuth } from '../auth/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <span className="brand">✓ TodoApp</span>
        {user && (
          <div className="navbar-user">
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
