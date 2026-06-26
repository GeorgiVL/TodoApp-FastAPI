import { test, expect } from '@playwright/test'
import {
  createTestUser,
  registerUserViaAPI,
  loginViaAPI,
  setAuthState,
} from './helpers'

test.describe('Profile management', () => {
  let user: ReturnType<typeof createTestUser>
  let token: string

  test.beforeAll(async () => {
    user = createTestUser()
    await registerUserViaAPI(user)
    token = await loginViaAPI(user.username, user.password)
  })

  test.beforeEach(async ({ page }) => {
    await setAuthState(page, token)
    await page.goto('/profile')
  })

  test('Verify that the profile page displays the user account information', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Your profile' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Account information' })).toBeVisible()

    await expect(page.locator('.profile-grid')).toContainText(user.username)
    await expect(page.locator('.profile-grid')).toContainText(user.email)
    await expect(page.locator('.profile-grid')).toContainText(user.first_name)
    await expect(page.locator('.profile-grid')).toContainText(user.last_name)
    await expect(page.locator('.role-badge')).toHaveText('user')
    await expect(page.locator('.status-badge')).toHaveText('Active')
  })

  test('Verify that a user can update their phone number', async ({ page }) => {
    await page.getByRole('button', { name: 'Edit' }).click()

    await expect(page.locator('#phone')).toBeVisible()
    await page.fill('#phone', '9998887777')
    await page.click('button[type="submit"]')

    await expect(page.locator('.phone-value')).toHaveText('9998887777')
  })

  test('Verify that a user can cancel phone number editing', async ({ page }) => {
    const originalPhone = await page.locator('.phone-value').textContent()

    await page.getByRole('button', { name: 'Edit' }).click()
    await page.fill('#phone', '0000000000')
    await page.getByRole('button', { name: 'Cancel' }).click()

    await expect(page.locator('.phone-value')).toHaveText(originalPhone || '')
  })

  test('Verify that a user can change their password successfully', async ({ page }) => {
    await page.fill('#current-password', user.password)
    await page.fill('#new-password', 'NewPassword456!')
    await page.fill('#confirm-new', 'NewPassword456!')
    await page.click('button[type="submit"]')

    await expect(page.locator('.form-success')).toBeVisible()
    await expect(page.locator('.form-success')).toContainText(/password changed successfully/i)

    user.password = 'NewPassword456!'
  })

  test('Verify that password change with an incorrect current password triggers an auto-logout', async ({ page }) => {
    await page.fill('#current-password', 'WrongCurrentPassword!')
    await page.fill('#new-password', 'SomeNewPassword!')
    await page.fill('#confirm-new', 'SomeNewPassword!')
    await page.click('button[type="submit"]')

    await expect(page).toHaveURL('/login')
  })

  test('Verify that password change fails when new passwords do not match', async ({ page }) => {
    await page.fill('#current-password', user.password)
    await page.fill('#new-password', 'NewPasswordA!')
    await page.fill('#confirm-new', 'NewPasswordB!')
    await page.click('button[type="submit"]')

    await expect(page.locator('.form-error')).toBeVisible()
    await expect(page.locator('.form-error')).toContainText(/new passwords do not match/i)
  })

  test('Verify that password change fails when the new password is too short', async ({ page }) => {
    await page.fill('#current-password', user.password)
    await page.fill('#new-password', '12345')
    await page.fill('#confirm-new', '12345')
    await page.click('button[type="submit"]')

    await expect(page.locator('.form-error')).toBeVisible()
    await expect(page.locator('.form-error')).toContainText(/at least 6 characters/i)
  })
})
