import { expect, test } from '@playwright/test'

test.describe('Accounts - multiple environment', () => {
  test('should display the select account page for multi-env user', async ({ page }) => {
    await page.goto('/login')
    await page.locator('[data-testid="input-email"] input').fill('all-env-admin-0@yopmail.com')
    await page.locator('[data-testid="input-password"] input').fill('password-0')
    await page.getByTestId('login-button').click()
    await expect(page).toHaveURL(/\/selection-du-compte/, { timeout: 30000 })
    await expect(page.getByTestId('select-account')).toBeVisible()
  })
})
