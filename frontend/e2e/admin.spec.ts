import { test, expect } from '@playwright/test'
import {
  createTestUser,
  registerUserViaAPI,
  loginViaAPI,
  setAuthState,
  createTodoViaAPI,
  getUserProfileViaAPI,
} from './helpers'

test.describe('Admin dashboard', () => {
  let adminUser: ReturnType<typeof createTestUser>
  let regularUser: ReturnType<typeof createTestUser>
  let adminToken: string
  let regularToken: string
  let regularUserId: number

  test.beforeAll(async () => {
    adminUser = createTestUser({ role: 'admin', first_name: 'Admin', last_name: 'Tester' })
    regularUser = createTestUser({ role: 'user', first_name: 'Regular', last_name: 'Tester' })
    await registerUserViaAPI(adminUser)
    await registerUserViaAPI(regularUser)

    adminToken = await loginViaAPI(adminUser.username, adminUser.password)
    regularToken = await loginViaAPI(regularUser.username, regularUser.password)

    const profile = await getUserProfileViaAPI(regularToken)
    regularUserId = profile.id

    await createTodoViaAPI(adminToken, {
      title: 'Admin task',
      description: 'Created by the admin user',
      priority: 4,
      complete: false,
    })
    await createTodoViaAPI(regularToken, {
      title: 'Regular user task',
      description: 'Created by the regular user',
      priority: 2,
      complete: false,
    })
  })

  test.beforeEach(async ({ page }) => {
    await setAuthState(page, adminToken)
    await page.goto('/admin')
  })

  test('Verify that an admin user can see the admin dashboard with todos from multiple users', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Admin dashboard' })).toBeVisible()
    await expect(page.locator('.admin-todo-item').filter({ hasText: 'Admin task' }).first()).toBeVisible()
    await expect(page.locator('.admin-todo-item').filter({ hasText: 'Regular user task' }).first()).toBeVisible()
  })

  test('Verify that a non-admin user cannot see the admin link in the navbar', async ({ page }) => {
    await setAuthState(page, regularToken)
    await page.goto('/')

    await expect(page.getByRole('link', { name: 'Admin' })).not.toBeVisible()
  })

  test('Verify that a non-admin user is redirected away from the admin page', async ({ page }) => {
    await setAuthState(page, regularToken)
    await page.goto('/admin')

    await expect(page).not.toHaveURL('/admin')
    await expect(page.getByRole('heading', { name: 'Admin dashboard' })).not.toBeVisible()
  })

  test('Verify that an admin user can delete any todo from the admin dashboard', async ({ page }) => {
    await createTodoViaAPI(regularToken, {
      title: 'Todo to be admin-deleted',
      description: 'Will be deleted by admin',
      priority: 1,
      complete: false,
    })
    await page.reload()

    page.on('dialog', (dialog) => dialog.accept())
    const targetItem = page.locator('.admin-todo-item').filter({ hasText: 'Todo to be admin-deleted' })
    await expect(targetItem).toBeVisible()

    await targetItem.getByRole('button', { name: 'Delete' }).click()

    await expect(targetItem).not.toBeVisible()
    await expect(page.locator('.admin-todo-item').filter({ hasText: 'Todo to be admin-deleted' })).toHaveCount(0)
  })

  test('Verify that the admin dashboard shows statistics across all users', async ({ page }) => {
    await expect(page.locator('.page-subtitle')).toContainText(/todo/)
    await expect(page.locator('.page-subtitle')).toContainText(/complete/)
    await expect(page.locator('.page-subtitle')).toContainText(/user/)
  })

  test('Verify that filtering by owner shows only todos from that user', async ({ page }) => {
    await page.selectOption('#filter-owner', { label: `User #${regularUserId}` })

    await expect(page.locator('.admin-todo-item').filter({ hasText: 'Regular user task' }).first()).toBeVisible()
    await expect(page.locator('.admin-todo-item').filter({ hasText: 'Admin task' })).toHaveCount(0)
  })

  test('Verify that sorting by owner ID reorders the admin todo list', async ({ page }) => {
    await page.selectOption('#sort-key', 'owner')

    const ownerLabels = await page.locator('.todo-owner').allTextContents()
    const ownerIds = ownerLabels.map((label) => parseInt(label.replace(/\D/g, ''), 10))
    const sortedIds = [...ownerIds].sort((a, b) => a - b)
    expect(ownerIds).toEqual(sortedIds)
  })

  test('Verify that the admin refresh button reloads the todo list', async ({ page }) => {
    await createTodoViaAPI(adminToken, {
      title: 'Refresh test todo',
      description: 'Should appear after refresh',
      priority: 3,
      complete: false,
    })

    await page.getByRole('button', { name: 'Refresh' }).click()

    await expect(page.locator('.admin-todo-item').filter({ hasText: 'Refresh test todo' }).first()).toBeVisible()
  })
})
