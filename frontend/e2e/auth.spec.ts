import { test, expect } from '@playwright/test'
import {
  createTestUser,
  registerUserViaAPI,
  loginViaAPI,
  setAuthState,
  authenticateViaUI,
} from './helpers'

test.describe('Authentication', () => {
  test('Verify that a new user can register through the UI and is automatically logged in', async ({ page }) => {
    const user = createTestUser()

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
    await expect(page).toHaveURL('/')
    await expect(page.getByRole('heading', { name: 'Your todos' })).toBeVisible()
    await expect(page.getByText(`Hi, ${user.username}`)).toBeVisible()
  })

  test('Verify that an existing user can log in with valid credentials', async ({ page }) => {
    const user = createTestUser()
    await registerUserViaAPI(user)

    await authenticateViaUI(page, user.username, user.password)

    await expect(page).toHaveURL('/')
    await expect(page.getByRole('heading', { name: 'Your todos' })).toBeVisible()
    await expect(page.getByText(`Hi, ${user.username}`)).toBeVisible()
  })

  test('Verify that login fails with an incorrect password and shows an error message', async ({ page }) => {
    const user = createTestUser()
    await registerUserViaAPI(user)

    await page.goto('/login')
    await page.fill('#username', user.username)
    await page.fill('#password', 'WrongPassword!')
    await page.click('button[type="submit"]')

    await expect(page.locator('.form-error')).toBeVisible()
    await expect(page.locator('.form-error')).toContainText(/incorrect username or password/i)
    await expect(page).toHaveURL('/login')
  })

  test('Verify that login fails with a non-existent username and shows an error message', async ({ page }) => {
    await page.goto('/login')
    await page.fill('#username', 'nonexistent_user_xyz')
    await page.fill('#password', 'somepassword')
    await page.click('button[type="submit"]')

    await expect(page.locator('.form-error')).toBeVisible()
    await expect(page.locator('.form-error')).toContainText(/incorrect username or password/i)
    await expect(page).toHaveURL('/login')
  })

  test('Verify that a user can log out and is redirected to the login page', async ({ page }) => {
    const user = createTestUser()
    await registerUserViaAPI(user)
    const token = await loginViaAPI(user.username, user.password)
    await setAuthState(page, token)
    await page.goto('/')

    await page.getByRole('button', { name: 'Log out' }).click()

    await expect(page).toHaveURL('/login')
    await expect(page.getByRole('heading', { name: /TodoApp/ })).toBeVisible()
  })

  test('Verify that the "Create one" link on the login page navigates to the register page', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('link', { name: 'Create one' }).click()

    await expect(page).toHaveURL('/register')
    await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible()
  })

  test('Verify that the "Sign in" link on the register page navigates to the login page', async ({ page }) => {
    await page.goto('/register')
    await page.getByRole('link', { name: 'Sign in' }).click()

    await expect(page).toHaveURL('/login')
    await expect(page.getByRole('heading', { name: /TodoApp/ })).toBeVisible()
  })

  test('Verify that password mismatch on the register form shows a validation error', async ({ page }) => {
    const user = createTestUser()

    await page.goto('/register')
    await page.fill('#first_name', user.first_name)
    await page.fill('#last_name', user.last_name)
    await page.fill('#reg-username', user.username)
    await page.fill('#email', user.email)
    await page.fill('#phone_number', user.phone_number)
    await page.fill('#reg-password', user.password)
    await page.fill('#confirm', 'DifferentPassword!')
    await page.click('button[type="submit"]')

    await expect(page.locator('.form-error')).toBeVisible()
    await expect(page.locator('.form-error')).toContainText(/passwords do not match/i)
    await expect(page).toHaveURL('/register')
  })

  test('Verify that an already authenticated user is redirected away from the login page', async ({ page }) => {
    const user = createTestUser()
    await registerUserViaAPI(user)
    const token = await loginViaAPI(user.username, user.password)
    await setAuthState(page, token)

    await page.goto('/login')

    await expect(page).toHaveURL('/')
    await expect(page.getByRole('heading', { name: 'Your todos' })).toBeVisible()
  })

  test('Verify that an already authenticated user is redirected away from the register page', async ({ page }) => {
    const user = createTestUser()
    await registerUserViaAPI(user)
    const token = await loginViaAPI(user.username, user.password)
    await setAuthState(page, token)

    await page.goto('/register')

    await expect(page).toHaveURL('/')
    await expect(page.getByRole('heading', { name: 'Your todos' })).toBeVisible()
  })
})
