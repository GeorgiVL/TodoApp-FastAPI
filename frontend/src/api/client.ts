// Thin fetch wrapper: prepends the API base URL, injects the bearer token,
// normalizes errors into ApiError, and notifies AuthContext on 401s.

const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:8000').replace(/\/$/, '')

const TOKEN_KEY = 'todoapp_token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

// AuthContext registers a callback here so an expired/invalid token logs the user out.
let onUnauthorized: (() => void) | null = null
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler
}

interface RequestOptions {
  method?: string
  body?: unknown
  form?: URLSearchParams
  auth?: boolean
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, form, auth = true } = options
  const headers: Record<string, string> = {}

  if (auth) {
    const token = getToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  let payload: BodyInit | undefined
  if (form) {
    headers['Content-Type'] = 'application/x-www-form-urlencoded'
    payload = form
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    payload = JSON.stringify(body)
  }

  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, { method, headers, body: payload })
  } catch {
    throw new ApiError('Cannot reach the server. Is the API running on ' + API_URL + '?', 0)
  }

  if (response.status === 401) {
    // Only force a logout for authenticated calls — a failed login is handled by the form.
    if (auth && onUnauthorized) onUnauthorized()
    throw new ApiError(await extractError(response, 'Authentication failed.'), 401)
  }

  if (!response.ok) {
    throw new ApiError(await extractError(response, `Request failed (${response.status}).`), response.status)
  }

  // 204 No Content (updates/deletes) and empty 201 bodies (create) have nothing to parse.
  if (response.status === 204) return undefined as T
  const text = await response.text()
  return (text ? JSON.parse(text) : undefined) as T
}

// FastAPI returns either {detail: "message"} or {detail: [{msg, loc}, ...]} for validation errors.
async function extractError(response: Response, fallback: string): Promise<string> {
  try {
    const data = await response.json()
    if (typeof data?.detail === 'string') return data.detail
    if (Array.isArray(data?.detail)) {
      return data.detail
        .map((e: { msg?: string }) => e.msg)
        .filter(Boolean)
        .join(', ')
    }
  } catch {
    // body was not JSON — fall through
  }
  return fallback
}
