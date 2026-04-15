import { expect, test } from '@playwright/test'
import { login } from './playwright.helpers'

test.describe('Legal Notices', () => {
  test('should be accessible from the profile view', async ({ page }) => {
    await login(page, 'bc-collaborator-1@yopmail.com', 'password-1')

    await page.goto('/profil')
    await expect(page.getByTestId('legal-notices-link')).toBeVisible()
    await page.getByTestId('legal-notices-link').click()
    await expect(page).toHaveURL(/\/mentions-legales/)
  })

  test('should display the body and content of the legal notices', async ({ page }) => {
    await login(page, 'bc-collaborator-1@yopmail.com', 'password-1')

    await page.goto('/mentions-legales')

    await expect(page.getByTestId('legal-notices')).toBeVisible()

    const contactMail = page.getByTestId('contact-mail')
    await expect(contactMail).toBeVisible()
    await expect(contactMail).toHaveText('contact@associationbilancarbone.fr')
    await expect(contactMail).toHaveAttribute('href', /mailto:/)

    const profileLink = page.getByTestId('profile-link')
    await profileLink.scrollIntoViewIfNeeded()
    await expect(profileLink).toBeVisible()
    await expect(profileLink).toHaveAttribute('href', '/profil')
    await expect(profileLink).toHaveText('Retour au profil')
  })
})
