// Shapes mirrored from the FastAPI backend (TodoApp/routers + models).

export interface Todo {
  id: number
  title: string
  description: string
  priority: number
  complete: boolean
  owner_id: number
}

// Body for POST /todos/todo and PUT /todos/todo/{id}
export interface TodoInput {
  title: string
  description: string
  priority: number
  complete: boolean
}

// Body for POST /auth/
export interface RegisterInput {
  username: string
  email: string
  first_name: string
  last_name: string
  password: string
  role: string
  phone_number: string
}

// Response from POST /auth/token
export interface TokenResponse {
  access_token: string
  token_type: string
}

// Claims encoded in the JWT by create_access_token()
export interface JwtPayload {
  sub: string
  id: number
  role: string
  exp: number
}
