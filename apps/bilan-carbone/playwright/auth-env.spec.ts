import { expect, test } from '@playwright/test'

test.describe('Authentication - Multi-environment', () => {
  test('CUT user can login', async ({ page }) => {
    await page.goto('/count')
    await expect(page).toHaveURL(/\/count\/login/)

    await page.locator('[data-testid="input-email"] input').fill('cut-env-admin-0@yopmail.com')
    await page.locator('[data-testid="input-password"] input').fill('password-0')
    await page.getByTestId('login-button').click()
    await expect(page).toHaveURL(/(?!.*\/login)/, { timeout: 30000 })
  })

  test('Tilt user can login', async ({ page }) => {
    await page.goto('/tilt')
    await expect(page).toHaveURL(/\/tilt\/login/)

    await page.locator('[data-testid="input-email"] input').fill('tilt-env-admin-0@yopmail.com')
    await page.locator('[data-testid="input-password"] input').fill('password-0')
    await page.getByTestId('login-button').click()
    await expect(page).toHaveURL(/(?!.*\/login)/, { timeout: 30000 })
  })

  test('Clickson user can login', async ({ page }) => {
    await page.goto('/clickson')
    await expect(page).toHaveURL(/\/clickson\/login/)

    await page.locator('[data-testid="input-email"] input').fill('clickson-env-admin-0@yopmail.com')
    await page.locator('[data-testid="input-password"] input').fill('password-0')
    await page.getByTestId('login-button').click()
    await expect(page).toHaveURL(/(?!.*\/login)/, { timeout: 30000 })
  })
})
