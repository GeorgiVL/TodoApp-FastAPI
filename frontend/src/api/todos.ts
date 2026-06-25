import { request } from './client'
import type { Todo, TodoInput } from '../types'

// GET /todos/ — all todos owned by the authenticated user.
export function listTodos(): Promise<Todo[]> {
  return request<Todo[]>('/todos/')
}

// POST /todos/todo — create a todo (201, no body).
export function createTodo(input: TodoInput): Promise<void> {
  return request<void>('/todos/todo', { method: 'POST', body: input })
}

// PUT /todos/todo/{id} — replace a todo (204, no body).
export function updateTodo(id: number, input: TodoInput): Promise<void> {
  return request<void>(`/todos/todo/${id}`, { method: 'PUT', body: input })
}

// DELETE /todos/todo/{id} — remove a todo (204, no body).
export function deleteTodo(id: number): Promise<void> {
  return request<void>(`/todos/todo/${id}`, { method: 'DELETE' })
}
