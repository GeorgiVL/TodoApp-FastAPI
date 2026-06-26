import { request, setToken } from './client'
import type { RegisterInput, TokenResponse } from '../types'

// POST /auth/ — create a new user. Returns 201 with no body.
export async function registerUser(input: RegisterInput): Promise<void> {
  await request<void>('/auth/', { method: 'POST', body: input, auth: false })
}

// POST /auth/token — OAuth2 password flow. Expects form-urlencoded data, not JSON.
export async function login(username: string, password: string): Promise<string> {
  const form = new URLSearchParams()
  form.append('username', username)
  form.append('password', password)

  const data = await request<TokenResponse>('/auth/token', { method: 'POST', form, auth: false })
  setToken(data.access_token)
  return data.access_token
}

// POST /auth/refresh — exchange a valid JWT for a fresh one with a new expiry.
export async function refreshToken(): Promise<string> {
  const data = await request<TokenResponse>('/auth/refresh', { method: 'POST' })
  setToken(data.access_token)
  return data.access_token
}
