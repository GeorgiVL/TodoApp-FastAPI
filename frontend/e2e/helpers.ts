import { request as apiRequest, expect, type Page } from '@playwright/test'

const API_URL = process.env.E2E_API_URL || process.env.VITE_API_URL || 'http://localhost:8000'

export interface TestUser {
  username: string
  email: string
  first_name: string
  last_name: string
  password: string
  role: string
  phone_number: string
}

let counter = 0

export function createTestUser(overrides: Partial<TestUser> = {}): TestUser {
  const suffix = `${Date.now().toString(36)}${(counter++).toString(36)}`
  return {
    username: `testuser_${suffix}`,
    email: `testuser_${suffix}@test.com`,
    first_name: 'Test',
    last_name: 'User',
    password: 'TestPassword123!',
    role: 'user',
    phone_number: '1234567890',
    ...overrides,
  }
}

export async function registerUserViaAPI(user: TestUser): Promise<void> {
  const context = await apiRequest.newContext()
  const res = await context.post(`${API_URL}/auth/`, { data: user })
  expect(res.ok()).toBeTruthy()
  await context.dispose()
}

export async function loginViaAPI(username: string, password: string): Promise<string> {
  const context = await apiRequest.newContext()
  const res = await context.post(`${API_URL}/auth/token`, {
    form: { username, password },
  })
  expect(res.ok()).toBeTruthy()
  const data = await res.json()
  await context.dispose()
  return data.access_token
}

export async function createTodoViaAPI(
  token: string,
  todo: { title: string; description: string; priority: number; complete: boolean },
): Promise<number> {
  const context = await apiRequest.newContext()
  const res = await context.post(`${API_URL}/todos/todo`, {
    headers: { Authorization: `Bearer ${token}` },
    data: todo,
  })
  expect(res.ok()).toBeTruthy()
  await context.dispose()
  return await getLatestTodoIdViaAPI(token)
}

export async function getLatestTodoIdViaAPI(token: string): Promise<number> {
  const context = await apiRequest.newContext()
  const res = await context.get(`${API_URL}/todos/`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  expect(res.ok()).toBeTruthy()
  const todos = await res.json()
  await context.dispose()
  if (todos.length === 0) throw new Error('No todos found')
  return Math.max(...todos.map((t: { id: number }) => t.id))
}

export async function deleteTodoViaAPI(token: string, todoId: number): Promise<void> {
  const context = await apiRequest.newContext()
  const res = await context.delete(`${API_URL}/todos/todo/${todoId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  expect(res.ok()).toBeTruthy()
  await context.dispose()
}

export async function deleteAllTodosViaAPI(token: string): Promise<void> {
  const context = await apiRequest.newContext()
  const res = await context.get(`${API_URL}/todos/`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok()) {
    await context.dispose()
    return
  }
  const todos = await res.json()
  for (const todo of todos) {
    await context.delete(`${API_URL}/todos/todo/${todo.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
  }
  await context.dispose()
}

export async function getUserProfileViaAPI(token: string): Promise<{ id: number; username: string }> {
  const context = await apiRequest.newContext()
  const res = await context.get(`${API_URL}/users/`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  expect(res.ok()).toBeTruthy()
  const data = await res.json()
  await context.dispose()
  return data
}

export async function authenticateViaUI(page: Page, username: string, password: string): Promise<void> {
  await page.goto('/login')
  await page.fill('#username', username)
  await page.fill('#password', password)
  await page.click('button[type="submit"]')
  await page.waitForURL('/')
}

export async function setAuthState(page: Page, token: string): Promise<void> {
  await page.addInitScript((t: string) => {
    localStorage.setItem('todoapp_token', t)
  }, token)
}

export async function registerAndAuthenticate(page: Page, user: TestUser): Promise<string> {
  await registerUserViaAPI(user)
  const token = await loginViaAPI(user.username, user.password)
  await setAuthState(page, token)
  return token
}

export async function registerAndLoginViaUI(page: Page, user: TestUser): Promise<void> {
  await page.goto('/register')
  await page.fill('#first_name', user.first_name)
  await page.fill('#last_name', user.last_name)
  await page.fill('#reg-username', user.username)
  await page.fill('#email', user.email)
  await page.fill('#phone_number', user.phone_number)
  await page.fill('#reg-password', user.password)
  await page.fill('#confirm', user.password)
  await page.click('button[type="submit"]')
  await page.waitForURL('/')
}
