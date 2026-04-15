import { expect, test } from '@playwright/test'
import { clearMaildev, getLatestEmailLink } from './playwright.helpers'

test.describe('Authentication', () => {
  test('does not authenticate with wrong password', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 })

    await page.locator('[data-testid="input-email"] input').fill('bc-collaborator-1@yopmail.com')
    await page.locator('[data-testid="input-password"] input').fill('wrongpassword')
    await page.getByTestId('login-button').click()

    await page.goto('/')
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })

  test('does authenticate with correct password', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 })

    await page.locator('[data-testid="input-email"] input').fill('bc-collaborator-1@yopmail.com')
    await page.locator('[data-testid="input-password"] input').fill('password-1')
    await page.getByTestId('login-button').click()

    await expect(page).not.toHaveURL(/\/login/, { timeout: 30000 })
  })

  test('does not authorize inactive user', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 })

    await page.locator('[data-testid="input-email"] input').fill('bc-new-1@yopmail.com')
    await page.locator('[data-testid="input-password"] input').fill('password-1')
    await page.getByTestId('login-button').click()

    await page.goto('/')
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })

  test('does activate account', async ({ page, request }) => {
    test.setTimeout(120000)

    await clearMaildev(request)
    const since = Date.now()

    // imported@yopmail.com has no password — try login, expect to stay on login with activation link shown
    await page.goto('/login')
    await page.locator('[data-testid="input-email"] input').fill('imported@yopmail.com')
    await page.locator('[data-testid="input-password"] input').fill('Password-0')
    await page.getByTestId('login-button').click()

    // Should remain on login and show the activation button
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
    await page.goto('/')
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
    await expect(page.getByTestId('activation-button')).toBeVisible()

    // Request activation
    await page.getByTestId('activation-button').click()
    await expect(page).toHaveURL(/\/activation/, { timeout: 10000 })

    await page.getByTestId('activation-email').locator('input').clear()
    await page.getByTestId('activation-email').locator('input').fill('imported@yopmail.com')
    await expect(page.getByTestId('activation-email').locator('input')).toHaveValue('imported@yopmail.com')
    await page.getByTestId('activation-button').click()

    await expect(page.getByTestId('activation-form-message')).toBeVisible({ timeout: 15000 })
    await expect(page.getByTestId('activation-form-message')).toContainText(
      "Une demande d'activation de votre compte a été envoyé à vos collègues",
    )

    // Admin validates the invitation from /equipe
    await page.goto('/logout')
    await page.goto('/login')
    await page.locator('[data-testid="input-email"] input').fill('bc-admin-0@yopmail.com')
    await page.locator('[data-testid="input-password"] input').fill('password-0')
    await page.getByTestId('login-button').click()
    await expect(page).not.toHaveURL(/\/login/, { timeout: 30000 })

    await page.goto('/equipe')
    await expect(page.getByTestId('invitations-to-validate')).toBeVisible({ timeout: 10000 })
    const invitation = page.getByTestId('invitation').filter({ hasText: 'imported@yopmail.com' })
    await expect(invitation).toBeVisible()
    await invitation.getByTestId('validate-invitation').click()

    await expect(page.getByTestId('pending-invitation').filter({ hasText: 'imported@yopmail.com' })).toBeVisible({
      timeout: 10000,
    })

    // Get activation email and follow the link to set password
    await page.goto('/logout')
    const activationLink = await getLatestEmailLink(request, 'imported@yopmail.com', since)
    await page.goto(activationLink)

    await page.locator('[data-testid="input-email"] input').fill('imported@yopmail.com')
    await page.locator('[data-testid="input-password"] input').fill('Password-0')
    await page.locator('[data-testid="input-confirm-password"] input').fill('Password-0')
    const resetResponse = page.waitForResponse(
      (r) => r.url().includes('/reset-password') && r.request().method() === 'POST',
    )
    await page.getByTestId('reset-button').click()
    await resetResponse

    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })

    // Should now be able to login
    await page.locator('[data-testid="input-email"] input').fill('imported@yopmail.com')
    await page.locator('[data-testid="input-password"] input').fill('Password-0')
    await page.getByTestId('login-button').click()
    await expect(page).not.toHaveURL(/\/login/, { timeout: 30000 })
  })

  test('does reset password', async ({ page, request }) => {
    test.setTimeout(60000)

    await clearMaildev(request)
    const since = Date.now()

    await page.goto('/login')
    await page.locator('[data-testid="input-email"] input').fill('bc-collaborator-2@yopmail.com')
    await page.getByTestId('reset-password-link').click()

    await expect(page).toHaveURL(/\/reset-password/, { timeout: 10000 })
    await expect(page.locator('[data-testid="input-email"] input')).toHaveValue('bc-collaborator-2@yopmail.com')

    // Change to a different email and request reset
    await page.locator('[data-testid="input-email"] input').clear()
    await page.locator('[data-testid="input-email"] input').fill('bc-collaborator-2@yopmail.com')
    const resetResponse = page.waitForResponse(
      (r) => r.url().includes('/reset-password') && r.request().method() === 'POST',
    )
    await page.getByTestId('reset-button').click()
    await resetResponse

    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })

    // Get reset link from maildev
    const resetLink = await getLatestEmailLink(request, 'bc-collaborator-2@yopmail.com', since)
    await page.goto(resetLink)

    // Set new password
    await page.locator('[data-testid="input-email"] input').fill('bc-collaborator-2@yopmail.com')
    await page.locator('[data-testid="input-password"] input').fill('new-Password-2')
    await page.locator('[data-testid="input-confirm-password"] input').fill('new-Password-2')
    const resetPasswordResponse = page.waitForResponse(
      (r) => r.url().includes('/reset-password') && r.request().method() === 'POST',
    )
    await page.getByTestId('reset-button').click()
    await resetPasswordResponse

    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })

    // New password should work
    await page.locator('[data-testid="input-email"] input').fill('bc-collaborator-2@yopmail.com')
    await page.locator('[data-testid="input-password"] input').fill('new-Password-2')
    await page.getByTestId('login-button').click()
    await expect(page).not.toHaveURL(/\/login/, { timeout: 30000 })

    // Old password should no longer work — but we need to restore it for future runs.
    // Re-use the same reset flow to restore to the original password.
    await page.goto('/logout')
    await clearMaildev(request)
    const since2 = Date.now()
    await page.goto('/reset-password')
    await page.locator('[data-testid="input-email"] input').fill('bc-collaborator-2@yopmail.com')
    const restoreResponse = page.waitForResponse(
      (r) => r.url().includes('/reset-password') && r.request().method() === 'POST',
    )
    await page.getByTestId('reset-button').click()
    await restoreResponse

    const restoreLink = await getLatestEmailLink(request, 'bc-collaborator-2@yopmail.com', since2)
    await page.goto(restoreLink)
    await page.locator('[data-testid="input-email"] input').fill('bc-collaborator-2@yopmail.com')
    await page.locator('[data-testid="input-password"] input').fill('password-2')
    await page.locator('[data-testid="input-confirm-password"] input').fill('password-2')
    const finalResetResponse = page.waitForResponse(
      (r) => r.url().includes('/reset-password') && r.request().method() === 'POST',
    )
    await page.getByTestId('reset-button').click()
    await finalResetResponse
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })
})
