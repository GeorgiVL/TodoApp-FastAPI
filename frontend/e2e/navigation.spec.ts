import { test, expect } from '@playwright/test'
import {
  createTestUser,
  registerUserViaAPI,
  loginViaAPI,
  setAuthState,
} from './helpers'

test.describe('Navigation and route protection', () => {
  test('Verify that an unauthenticated user visiting the root is redirected to the login page', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveURL('/login')
    await expect(page.getByRole('heading', { name: /TodoApp/ })).toBeVisible()
  })

  test('Verify that an unauthenticated user cannot access the profile page', async ({ page }) => {
    await page.goto('/profile')

    await expect(page).toHaveURL('/login')
  })

  test('Verify that an unauthenticated user cannot access the admin page', async ({ page }) => {
    await page.goto('/admin')

    await expect(page).not.toHaveURL('/admin')
    await expect(page.getByRole('heading', { name: 'Admin dashboard' })).not.toBeVisible()
  })

  test('Verify that a non-admin user is redirected away from the admin page', async ({ page }) => {
    const user = createTestUser({ role: 'user' })
    await registerUserViaAPI(user)
    const token = await loginViaAPI(user.username, user.password)
    await setAuthState(page, token)

    await page.goto('/admin')

    await expect(page).not.toHaveURL('/admin')
    await expect(page.getByRole('heading', { name: 'Admin dashboard' })).not.toBeVisible()
  })

  test('Verify that navigating to an unknown route redirects to the login page when unauthenticated', async ({ page }) => {
    await page.goto('/nonexistent-page')

    await expect(page).toHaveURL('/login')
  })

  test('Verify that navigating to an unknown route redirects to the home page when authenticated', async ({ page }) => {
    const user = createTestUser()
    await registerUserViaAPI(user)
    const token = await loginViaAPI(user.username, user.password)
    await setAuthState(page, token)

    await page.goto('/nonexistent-page')

    await expect(page).toHaveURL('/')
    await expect(page.getByRole('heading', { name: 'Your todos' })).toBeVisible()
  })

  test('Verify that the health badge shows online status when the backend is reachable', async ({ page }) => {
    const user = createTestUser()
    await registerUserViaAPI(user)
    const token = await loginViaAPI(user.username, user.password)
    await setAuthState(page, token)
    await page.goto('/')

    await expect(page.getByText('Online')).toBeVisible()
  })

  test('Verify that the navbar shows navigation links for an authenticated user', async ({ page }) => {
    const user = createTestUser()
    await registerUserViaAPI(user)
    const token = await loginViaAPI(user.username, user.password)
    await setAuthState(page, token)
    await page.goto('/')

    await expect(page.getByRole('link', { name: 'Todos' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Profile' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Log out' })).toBeVisible()
    await expect(page.getByText(`Hi, ${user.username}`)).toBeVisible()
  })

  test('Verify that the brand link navigates to the todos page from the profile page', async ({ page }) => {
    const user = createTestUser()
    await registerUserViaAPI(user)
    const token = await loginViaAPI(user.username, user.password)
    await setAuthState(page, token)
    await page.goto('/profile')

    await page.getByRole('link', { name: /TodoApp/ }).first().click()

    await expect(page).toHaveURL('/')
    await expect(page.getByRole('heading', { name: 'Your todos' })).toBeVisible()
  })

  test('Verify that the Todos nav link navigates to the todos page from the profile page', async ({ page }) => {
    const user = createTestUser()
    await registerUserViaAPI(user)
    const token = await loginViaAPI(user.username, user.password)
    await setAuthState(page, token)
    await page.goto('/profile')

    await page.getByRole('link', { name: 'Todos' }).click()

    await expect(page).toHaveURL('/')
    await expect(page.getByRole('heading', { name: 'Your todos' })).toBeVisible()
  })

  test('Verify that the Profile nav link navigates to the profile page from the todos page', async ({ page }) => {
    const user = createTestUser()
    await registerUserViaAPI(user)
    const token = await loginViaAPI(user.username, user.password)
    await setAuthState(page, token)
    await page.goto('/')

    await page.getByRole('link', { name: 'Profile' }).click()

    await expect(page).toHaveURL('/profile')
    await expect(page.getByRole('heading', { name: 'Your profile' })).toBeVisible()
  })
})
