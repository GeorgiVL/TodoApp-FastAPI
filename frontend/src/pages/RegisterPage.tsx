import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { ApiError } from '../api/client'

export default function RegisterPage() {
  const { isAuthenticated, register } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    phone_number: '',
    password: '',
    confirm: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (isAuthenticated) return <Navigate to="/" replace />

  function update(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (form.password !== form.confirm) {
      setError('Passwords do not match.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await register({
        first_name: form.first_name,
        last_name: form.last_name,
        username: form.username,
        email: form.email,
        phone_number: form.phone_number,
        password: form.password,
        role: 'user',
      })
      // register() auto-logs in, so go straight to the app.
      navigate('/', { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create the account. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card auth-card-wide">
        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle">Start organizing your todos in seconds</p>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="field">
              <label htmlFor="first_name">First name</label>
              <input id="first_name" type="text" value={form.first_name} onChange={update('first_name')} required />
            </div>
            <div className="field">
              <label htmlFor="last_name">Last name</label>
              <input id="last_name" type="text" value={form.last_name} onChange={update('last_name')} required />
            </div>
          </div>

          <div className="field">
            <label htmlFor="reg-username">Username</label>
            <input id="reg-username" type="text" value={form.username} onChange={update('username')} autoComplete="username" required />
          </div>

          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" value={form.email} onChange={update('email')} autoComplete="email" required />
          </div>

          <div className="field">
            <label htmlFor="phone_number">Phone number</label>
            <input id="phone_number" type="tel" value={form.phone_number} onChange={update('phone_number')} />
          </div>

          <div className="form-row">
            <div className="field">
              <label htmlFor="reg-password">Password</label>
              <input id="reg-password" type="password" value={form.password} onChange={update('password')} autoComplete="new-password" required />
            </div>
            <div className="field">
              <label htmlFor="confirm">Confirm password</label>
              <input id="confirm" type="password" value={form.confirm} onChange={update('confirm')} autoComplete="new-password" required />
            </div>
          </div>

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
