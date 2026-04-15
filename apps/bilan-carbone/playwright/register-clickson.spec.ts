import { expect, test } from '@playwright/test'
import { clearMaildev, getLatestEmailLink } from './playwright.helpers'

test.describe('Register Clickson', () => {
  test('does create new Clickson user and organization with school', async ({ page, request }) => {
    test.setTimeout(60000)

    await clearMaildev(request)
    const since = Date.now()

    await page.goto('/clickson/register')
    await expect(page.getByTestId('activation-email')).toBeVisible()
    await expect(page.getByTestId('activation-school')).toBeVisible()
    await expect(page.getByTestId('activation-button')).toBeVisible()

    await page.getByTestId('activation-email').locator('input').fill('clickson-school@yopmail.com')

    // Type postal code and wait for school suggestions to load
    const schoolInput = page.getByTestId('activation-school').locator('input')
    await schoolInput.pressSequentially('78600', { delay: 100 })
    await expect(page.getByTestId('school-option-0781587B')).toBeVisible({ timeout: 15000 })
    await page.getByTestId('school-option-0781587B').click()

    const serverResponse = page.waitForResponse(
      (r) => r.request().method() === 'POST',
      { timeout: 15000 },
    )
    await page.getByTestId('activation-button').click()
    await serverResponse

    await expect(page.getByTestId('activation-form-message')).toBeVisible({ timeout: 15000 })
    await expect(page.getByTestId('activation-form-message')).toContainText(
      "Vous allez recevoir un mail pour finaliser l'activation de votre compte.",
    )

    const emailLink = await getLatestEmailLink(request, 'clickson-school@yopmail.com', since)
    expect(emailLink).toBeTruthy()
  })

  test('does not create new Clickson user with wrong postal code and no selected school', async ({ page }) => {
    await page.goto('/clickson/register')

    await page.getByTestId('activation-email').locator('input').fill('clickson-wrong-postal-code@yopmail.com')

    const schoolInput = page.getByTestId('activation-school').locator('input')
    await schoolInput.fill('00000')

    await page.getByTestId('activation-button').click()

    await expect(page.getByTestId('activation-form-message')).toBeVisible({ timeout: 10000 })
    await expect(page.getByTestId('activation-form-message')).toContainText(
      'Veuillez chercher et sélectionner votre établissement.',
    )
  })

  test('does create new Clickson user and ask for validation to already existing organization', async ({
    page,
    request,
  }) => {
    test.setTimeout(60000)

    await clearMaildev(request)
    const since = Date.now()

    await page.goto('/clickson/register')

    await page.getByTestId('activation-email').locator('input').fill('clickson-school-pending@yopmail.com')

    const schoolInput = page.getByTestId('activation-school').locator('input')
    await schoolInput.pressSequentially('92100', { delay: 100 })
    await expect(page.getByTestId('school-option-0922798S')).toBeVisible({ timeout: 15000 })
    await page.getByTestId('school-option-0922798S').click()

    const serverResponse = page.waitForResponse(
      (r) => r.request().method() === 'POST',
      { timeout: 15000 },
    )
    await page.getByTestId('activation-button').click()
    await serverResponse

    await expect(page.getByTestId('activation-form-message')).toBeVisible({ timeout: 10000 })
    await expect(page.getByTestId('activation-form-message')).toContainText(
      "Une demande d'activation de votre compte a été envoyé à vos collègues",
    )

    // Verify an email was sent (to org admins)
    const res = await page.request.get('http://localhost:1080/email')
    const emails: Array<{ id: string; date: string }> = await res.json()
    const newEmails = emails.filter((e) => new Date(e.date).getTime() > since)
    expect(newEmails.length).toBeGreaterThan(0)
  })
})
