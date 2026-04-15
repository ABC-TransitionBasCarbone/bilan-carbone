import { expect, test } from '@playwright/test'
import { clearMaildev, getLatestEmailLink } from './playwright.helpers'

test.describe('Onboarding', () => {
  test('trained user has ADMIN role after onboarding', async ({ page, request }) => {
    test.setTimeout(90000)

    await clearMaildev(request)
    const since = Date.now()

    await page.goto('/login')
    await page.locator('[data-testid="input-email"] input').fill('onboarding@yopmail.com')
    await page.locator('[data-testid="input-password"] input').fill('onboarding1234')
    await page.getByTestId('login-button').click()

    // User is not active yet — remains on login or gets redirected to activation prompt
    await page.goto('/activation')

    await page.getByTestId('activation-email').locator('input').fill('onboarding@yopmail.com')
    await page.getByTestId('activation-button').click()

    await expect(page.getByTestId('activation-form-message')).toBeVisible({ timeout: 15000 })
    await expect(page.getByTestId('activation-form-message')).toContainText(
      "Vous allez recevoir un mail pour finaliser l'activation de votre compte.",
    )

    const resetLink = await getLatestEmailLink(request, 'onboarding@yopmail.com', since)
    await page.goto(resetLink)

    await page.locator('[data-testid="input-email"] input').fill('onboarding@yopmail.com')
    await page.locator('[data-testid="input-password"] input').fill('Password-0')
    await page.locator('[data-testid="input-confirm-password"] input').fill('Password-0')
    const resetResponse = page.waitForResponse(
      (r) => r.url().includes('/reset-password') && r.request().method() === 'POST',
    )
    await page.getByTestId('reset-button').click()
    await resetResponse

    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })

    await page.locator('[data-testid="input-email"] input').fill('onboarding@yopmail.com')
    await page.locator('[data-testid="input-password"] input').fill('Password-0')
    await page.getByTestId('login-button').click()

    await expect(page.getByTestId('onboarding-modal')).toBeVisible({ timeout: 30000 })
    await expect(page.getByTestId('user-role')).toBeVisible()
    await expect(page.getByTestId('user-role')).toHaveText('Administrateur·rice')
  })

  test('untrained user has GESTIONNAIRE role after onboarding', async ({ page, request }) => {
    test.setTimeout(90000)

    await clearMaildev(request)
    const since = Date.now()

    await page.goto('/login')
    await page.locator('[data-testid="input-email"] input').fill('onboardingnottrained@yopmail.com')
    await page.locator('[data-testid="input-password"] input').fill('onboarding1234')
    await page.getByTestId('login-button').click()

    await page.goto('/activation')

    await page.getByTestId('activation-email').locator('input').fill('onboardingnottrained@yopmail.com')
    await page.getByTestId('activation-button').click()

    await expect(page.getByTestId('activation-form-message')).toBeVisible({ timeout: 15000 })
    await expect(page.getByTestId('activation-form-message')).toContainText(
      "Vous allez recevoir un mail pour finaliser l'activation de votre compte.",
    )

    const resetLink = await getLatestEmailLink(request, 'onboardingnottrained@yopmail.com', since)
    await page.goto(resetLink)

    await page.locator('[data-testid="input-email"] input').fill('onboardingnottrained@yopmail.com')
    await page.locator('[data-testid="input-password"] input').fill('Password-0')
    await page.locator('[data-testid="input-confirm-password"] input').fill('Password-0')
    const resetResponse = page.waitForResponse(
      (r) => r.url().includes('/reset-password') && r.request().method() === 'POST',
    )
    await page.getByTestId('reset-button').click()
    await resetResponse

    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })

    await page.locator('[data-testid="input-email"] input').fill('onboardingnottrained@yopmail.com')
    await page.locator('[data-testid="input-password"] input').fill('Password-0')
    await page.getByTestId('login-button').click()

    await expect(page.getByTestId('onboarding-modal')).toBeVisible({ timeout: 30000 })
    await expect(page.getByTestId('user-role')).toBeVisible()
    await expect(page.getByTestId('user-role')).toHaveText('Gestionnaire')
  })
})
