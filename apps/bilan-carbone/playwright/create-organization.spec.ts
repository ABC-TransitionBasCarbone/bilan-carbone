import { expect, test } from '@playwright/test'
import { login } from './playwright.helpers'

test.describe('Create organization', () => {
  test('should create a child organization as a CR user and delete it', async ({ page }) => {
    test.setTimeout(60000)

    await login(page, 'bc-cr-collaborator-1@yopmail.com', 'password-1')

    await page.getByTestId('checklist-button').click()
    await page.getByTestId('new-organization').click()

    await expect(page.getByTestId('new-organization-title')).toBeVisible()
    await page.getByTestId('new-organization-name').locator('input').fill('My new organization (pw)')

    const createResponse = page.waitForResponse(
      (r) => r.url().includes('/organisations/creer') && r.request().method() === 'POST',
    )
    await page.getByTestId('new-organization-create-button').click()
    await createResponse

    await expect(page.getByTestId('organization-name')).toContainText('My new organization (pw)')

    // Cleanup: delete the organization we just created
    await page.getByTestId('edit-organization-button').click({ force: true })
    await page.waitForTimeout(500)
    const deleteBtn = page.getByTestId('delete-organization-button')
    if (await deleteBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await deleteBtn.click()
      const confirmBtn = page.getByTestId('confirm-delete-organization')
      if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await confirmBtn.click()
      }
    }
  })
})
