import { test, expect } from '@playwright/test'
import {
  createTestUser,
  registerUserViaAPI,
  loginViaAPI,
  setAuthState,
  createTodoViaAPI,
  deleteTodoViaAPI,
  deleteAllTodosViaAPI,
} from './helpers'

test.describe('Todos management', () => {
  let user: ReturnType<typeof createTestUser>
  let token: string

  test.beforeAll(async () => {
    user = createTestUser()
    await registerUserViaAPI(user)
    token = await loginViaAPI(user.username, user.password)
  })

  test.beforeEach(async ({ page }) => {
    await setAuthState(page, token)
    await page.goto('/')
  })

  test.afterEach(async () => {
    await deleteAllTodosViaAPI(token)
  })

  test('Verify that a newly authenticated user sees an empty state on the todos page', async ({ page }) => {
    await expect(page.getByText('No todos yet.')).toBeVisible()
    await expect(page.getByText('Create your first one to get started.')).toBeVisible()
  })

  test('Verify that a user can create a new todo through the UI', async ({ page }) => {
    await page.getByRole('button', { name: '+ New todo' }).click()

    await page.fill('#todo-title', 'Write e2e tests')
    await page.fill('#todo-description', 'Cover all major user flows with Playwright')
    await page.selectOption('#todo-priority', '5')
    await page.click('button[type="submit"]')

    await expect(page.locator('.todo-item')).toHaveCount(1)
    await expect(page.locator('.todo-title')).toHaveText('Write e2e tests')
    await expect(page.locator('.todo-description')).toHaveText('Cover all major user flows with Playwright')
    await expect(page.locator('.priority-badge')).toContainText('P5')
  })

  test('Verify that a user can edit an existing todo', async ({ page }) => {
    const todoId = await createTodoViaAPI(token, {
      title: 'Original title',
      description: 'Original description',
      priority: 3,
      complete: false,
    })
    await page.reload()

    await page.getByRole('button', { name: 'Edit' }).first().click()
    await expect(page.getByRole('heading', { name: 'Edit todo' })).toBeVisible()

    await page.fill('#todo-title', 'Updated title')
    await page.fill('#todo-description', 'Updated description text')
    await page.selectOption('#todo-priority', '1')
    await page.click('button[type="submit"]')

    await expect(page.locator('.todo-title')).toHaveText('Updated title')
    await expect(page.locator('.todo-description')).toHaveText('Updated description text')
    await expect(page.locator('.priority-badge')).toContainText('P1')
  })

  test('Verify that a user can delete a todo after confirming the deletion', async ({ page }) => {
    await createTodoViaAPI(token, {
      title: 'Todo to delete',
      description: 'This todo will be removed',
      priority: 2,
      complete: false,
    })
    await page.reload()

    page.on('dialog', (dialog) => dialog.accept())
    await page.getByRole('button', { name: 'Delete' }).click()

    await expect(page.locator('.todo-item')).toHaveCount(0)
    await expect(page.getByText('No todos yet.')).toBeVisible()
  })

  test('Verify that a user can cancel a todo deletion', async ({ page }) => {
    await createTodoViaAPI(token, {
      title: 'Todo to keep',
      description: 'This todo should remain',
      priority: 2,
      complete: false,
    })
    await page.reload()

    page.on('dialog', (dialog) => dialog.dismiss())
    await page.getByRole('button', { name: 'Delete' }).click()

    await expect(page.locator('.todo-item')).toHaveCount(1)
    await expect(page.locator('.todo-title')).toHaveText('Todo to keep')
  })

  test('Verify that a user can toggle a todo as complete', async ({ page }) => {
    const todoId = await createTodoViaAPI(token, {
      title: 'Toggle me',
      description: 'Check and uncheck this todo',
      priority: 3,
      complete: false,
    })
    await page.reload()

    await page.locator('.todo-check').first().click()
    await expect(page.locator('.todo-item').first()).toHaveClass(/is-complete/)

    await page.locator('.todo-check').first().click()
    await expect(page.locator('.todo-item').first()).not.toHaveClass(/is-complete/)
  })

  test('Verify that the todo list shows the correct completion count', async ({ page }) => {
    const id1 = await createTodoViaAPI(token, {
      title: 'Task one',
      description: 'First task',
      priority: 3,
      complete: false,
    })
    const id2 = await createTodoViaAPI(token, {
      title: 'Task two',
      description: 'Second task',
      priority: 3,
      complete: false,
    })
    await page.reload()

    await expect(page.locator('.page-subtitle')).toContainText('0 of 2 complete')

    await page.locator('.todo-check').first().click()
    await expect(page.locator('.page-subtitle')).toContainText('1 of 2 complete')

  })

  test('Verify that sorting by priority (high to low) reorders the todos', async ({ page }) => {
    const id1 = await createTodoViaAPI(token, { title: 'Low priority', description: 'Priority 1', priority: 1, complete: false })
    const id2 = await createTodoViaAPI(token, { title: 'High priority', description: 'Priority 5', priority: 5, complete: false })
    const id3 = await createTodoViaAPI(token, { title: 'Medium priority', description: 'Priority 3', priority: 3, complete: false })
    await page.reload()

    await page.selectOption('#sort', 'priority-desc')

    const titles = await page.locator('.todo-title').allTextContents()
    expect(titles).toEqual(['High priority', 'Medium priority', 'Low priority'])

  })

  test('Verify that sorting by title (A-Z) reorders the todos', async ({ page }) => {
    const id1 = await createTodoViaAPI(token, { title: 'Zebra task', description: 'Starts with Z', priority: 3, complete: false })
    const id2 = await createTodoViaAPI(token, { title: 'Apple task', description: 'Starts with A', priority: 3, complete: false })
    const id3 = await createTodoViaAPI(token, { title: 'Mango task', description: 'Starts with M', priority: 3, complete: false })
    await page.reload()

    await page.selectOption('#sort', 'title')

    const titles = await page.locator('.todo-title').allTextContents()
    expect(titles).toEqual(['Apple task', 'Mango task', 'Zebra task'])

  })

  test('Verify that filtering by priority shows only matching todos', async ({ page }) => {
    const id1 = await createTodoViaAPI(token, { title: 'Priority 1 task', description: 'Low', priority: 1, complete: false })
    const id2 = await createTodoViaAPI(token, { title: 'Priority 5 task', description: 'High', priority: 5, complete: false })
    await page.reload()

    await page.selectOption('#filter-priority', '5')

    await expect(page.locator('.todo-item')).toHaveCount(1)
    await expect(page.locator('.todo-title')).toHaveText('Priority 5 task')

  })

  test('Verify that the create todo form can be cancelled', async ({ page }) => {
    await page.getByRole('button', { name: '+ New todo' }).click()
    await expect(page.getByRole('heading', { name: 'Add a todo' })).toBeVisible()

    await page.getByRole('button', { name: 'Cancel' }).click()

    await expect(page.getByRole('heading', { name: 'Add a todo' })).not.toBeVisible()
  })

  test('Verify that the edit todo modal can be cancelled by clicking the overlay', async ({ page }) => {
    const todoId = await createTodoViaAPI(token, {
      title: 'Edit modal test',
      description: 'Click outside to close',
      priority: 3,
      complete: false,
    })
    await page.reload()

    await page.getByRole('button', { name: 'Edit' }).first().click()
    await expect(page.getByRole('heading', { name: 'Edit todo' })).toBeVisible()

    await page.locator('.modal-overlay').click({ position: { x: 5, y: 5 } })

    await expect(page.getByRole('heading', { name: 'Edit todo' })).not.toBeVisible()
  })

  test('Verify that the todo form validates the minimum title length', async ({ page }) => {
    await page.getByRole('button', { name: '+ New todo' }).click()
    await page.fill('#todo-title', 'ab')
    await page.fill('#todo-description', 'Valid description here')
    await page.click('button[type="submit"]')

    await expect(page.locator('.todo-form .form-error')).toBeVisible()
    await expect(page.locator('.todo-form .form-error')).toContainText(/title must be at least 3 characters/i)
  })

  test('Verify that the todo form char counter updates as the user types', async ({ page }) => {
    await page.getByRole('button', { name: '+ New todo' }).click()
    await page.fill('#todo-description', 'A'.repeat(50))

    await expect(page.locator('.char-count')).toContainText('50/100')
  })
})
