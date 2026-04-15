import { expect, test } from '@playwright/test'
import { createStudy, login } from './playwright.helpers'

const studyName = 'Study to delete (playwright)'

test.describe('Delete study', () => {
  test('should be able to delete a study', async ({ page }) => {
    test.setTimeout(90000)

    await login(page, 'bc-collaborator-0@yopmail.com', 'password-0')

    // Create a study to delete so the test is repeatable
    const studyUrl = await createStudy(page, studyName)
    await page.goto(studyUrl)

    await page.getByTestId('delete-study').click()
    await expect(page.locator('#delete-study-modal-title')).toBeVisible()
    await expect(page.locator('#delete-study-modal-content')).toBeVisible()

    // Wrong name should fail
    await page.getByTestId('delete-study-name-field').locator('input').fill(studyName.slice(0, -1))
    await expect(page.getByTestId('alert-toaster')).toHaveCount(0)
    await page.getByTestId('confirm-study-deletion').click()
    await expect(page.getByTestId('alert-toaster')).toBeVisible()
    await expect(page.getByTestId('alert-toaster')).toContainText("Le nom de l'étude ne correspond pas")

    // Correct name should succeed
    await page.getByTestId('delete-study-name-field').locator('input').fill(studyName)
    const deleteResponse = page.waitForResponse((r) => r.url().includes('/etudes/') && r.request().method() === 'POST')
    await page.getByTestId('confirm-study-deletion').click()
    await deleteResponse
    await expect(page).toHaveURL(/\/$/, { timeout: 15000 })

    // The study URL should now be a not-found page
    await page.goto(studyUrl)
    await expect(page.getByTestId('not-found-page')).toBeVisible({ timeout: 10000 })
  })
})
