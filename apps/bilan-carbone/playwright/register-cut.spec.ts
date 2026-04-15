import { expect, test } from '@playwright/test'
import { clearMaildev, getLatestEmailLink } from './playwright.helpers'

test.describe('Register CUT', () => {
  test('does create new CUT user and organization with CNC', async ({ page, request }) => {
    test.setTimeout(60000)

    await clearMaildev(request)
    const since = Date.now()

    await page.goto('/count/register')
    await expect(page.getByTestId('activation-email')).toBeVisible()
    await expect(page.getByTestId('activation-siretOrCNC')).toBeVisible()
    await expect(page.getByTestId('activation-button')).toBeVisible()

    await page.getByTestId('activation-email').locator('input').fill('cut-cnc@yopmail.com')
    await page.getByTestId('activation-siretOrCNC').locator('input').pressSequentially('1321', { delay: 50 })

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

    const emailLink = await getLatestEmailLink(request, 'cut-cnc@yopmail.com', since)
    expect(emailLink).toBeTruthy()
  })

  test('does not create new CUT user with wrong CNC', async ({ page }) => {
    await page.goto('/count/register')

    await page.getByTestId('activation-email').locator('input').fill('cut-wrong-cnc@yopmail.com')
    await page.getByTestId('activation-siretOrCNC').locator('input').pressSequentially('0', { delay: 50 })

    const serverResponse = page.waitForResponse(
      (r) => r.request().method() === 'POST',
      { timeout: 15000 },
    )
    await page.getByTestId('activation-button').click()
    await serverResponse

    await expect(page.getByTestId('activation-form-message')).toBeVisible({ timeout: 10000 })
    await expect(page.getByTestId('activation-form-message')).toContainText("Ce Siret ou code CNC n'est pas reconnu")
  })

  test('does create new CUT user and ask for validation to already existing organization', async ({ page, request }) => {
    test.setTimeout(60000)

    await clearMaildev(request)
    const since = Date.now()

    await page.goto('/count/register')

    await page.getByTestId('activation-email').locator('input').fill('cut-pending@yopmail.com')
    await page.getByTestId('activation-siretOrCNC').locator('input').pressSequentially('1234567891234', { delay: 50 })

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

    // An email should have been sent to the org's admin(s)
    const emailLink = await getLatestEmailLink(request, 'cut-pending@yopmail.com', since).catch(() => null)
    // The email goes to the org admins, not the registrant — just verify a mail was sent
    const res = await page.request.get('http://localhost:1080/email')
    const emails: Array<{ id: string; date: string }> = await res.json()
    const newEmails = emails.filter((e) => new Date(e.date).getTime() > since)
    expect(newEmails.length).toBeGreaterThan(0)
  })
})
