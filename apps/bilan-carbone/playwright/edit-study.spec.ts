import dayjs from 'dayjs'
import { expect, test } from '@playwright/test'
import { deleteCurrentStudy, login } from './playwright.helpers'

test.describe('Edit study', () => {
  test('should be able to create a study with sites', async ({ page }) => {
    test.setTimeout(90000)

    await login(page, 'bc-collaborator-0@yopmail.com', 'password-0')

    await page.goto('/etudes/creer')

    // Select second site
    const siteCheckboxes = page.getByTestId('organization-sites-checkbox')
    await siteCheckboxes.nth(1).locator('input').click({ force: true })
    await page.getByTestId('organization-sites-etp').nth(1).locator('input').fill('1')
    await page.getByTestId('organization-sites-ca').nth(1).locator('input').fill('1')

    await expect(page.getByTestId('new-study-organization-button')).not.toBeDisabled()
    await page.getByTestId('new-study-organization-button').click()

    const studyName = `My new study (playwright ${Date.now()})`
    await page.getByTestId('new-study-name').locator('input').fill(studyName)

    const validatorInput = page.getByTestId('new-validator-name').locator('input')
    await validatorInput.click()
    await validatorInput.press('ArrowDown')
    await expect(page.locator('[data-option-index="0"]')).toBeVisible({ timeout: 10000 })
    await page.locator('[data-option-index="0"]').click()

    const endDateWrapper = page.getByTestId('new-study-endDate')
    await endDateWrapper.click()
    await page.keyboard.type(dayjs().add(1, 'y').format('DD/MM/YYYY'))

    await page.getByTestId('new-study-level').click()
    await page.locator('[data-value="Initial"]').click()

    const createResponse = page.waitForResponse(
      (r) => r.url().includes('/etudes/creer') && r.request().method() === 'POST',
    )
    await page.getByTestId('new-study-create-button').click()
    await createResponse

    await expect(page).toHaveURL(/\/etudes\/[a-f0-9-]{36}/, { timeout: 15000 })
    await expect(page.getByText(studyName).first()).toBeVisible({ timeout: 10000 })

    // Cleanup: delete the study we just created
    await deleteCurrentStudy(page, studyName)
  })
})
