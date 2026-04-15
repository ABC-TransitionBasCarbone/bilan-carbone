import dayjs from 'dayjs'
import { expect, test } from '@playwright/test'
import { createStudy, deleteCurrentStudy, login, logout } from './playwright.helpers'

const suffix = `(playwright-${Date.now()})`

test.describe('Create study', () => {
  test.describe('BC environment', () => {
    test('should create a study as BC collaborator (simple user)', async ({ page }) => {
      test.setTimeout(90000)

      const studyName = `BC Collaborator study ${suffix}`
      await login(page, 'bc-collaborator-0@yopmail.com', 'password-0')

      await page.goto('/etudes/creer')

      // Single org: org name shown as title, no org select dropdown
      await expect(page.getByTestId('new-study-organization-title')).toBeVisible({ timeout: 15000 })
      await expect(page.getByTestId('new-study-organization-select')).toHaveCount(0)

      // Next button disabled until a site is checked
      await expect(page.getByTestId('new-study-organization-button')).toBeDisabled()
      await page.getByTestId('organization-sites-checkbox').first().locator('input').click({ force: true })
      await expect(page.getByTestId('new-study-organization-button')).toBeEnabled()
      await page.getByTestId('new-study-organization-button').click()

      // Fill study form
      await page.getByTestId('new-study-name').locator('input').fill(studyName)

      const validatorInput = page.getByTestId('new-validator-name').locator('input')
      await validatorInput.click()
      await validatorInput.press('ArrowDown')
      await expect(page.locator('[data-option-index="0"]')).toBeVisible({ timeout: 10000 })
      await page.locator('[data-option-index="0"]').click()

      await page.getByTestId('new-study-level').click()
      await page.locator('[data-value="Initial"]').click()

      const endDateWrapper = page.getByTestId('new-study-endDate')
      await endDateWrapper.click()
      await page.keyboard.type(dayjs().add(1, 'y').format('DD/MM/YYYY'))

      const createResponse = page.waitForResponse(
        (r) => r.url().includes('/etudes/creer') && r.request().method() === 'POST',
      )
      await page.getByTestId('new-study-create-button').click()
      await createResponse

      await expect(page).toHaveURL(/\/etudes\/[a-f0-9-]{36}/, { timeout: 15000 })
      await expect(page.getByText(studyName)).toBeVisible({ timeout: 10000 })

      await deleteCurrentStudy(page, studyName)
    })

    test('should create a study as BC Admin', async ({ page }) => {
      test.setTimeout(90000)

      const studyName = `BC Admin study ${suffix}`
      await login(page, 'bc-admin-0@yopmail.com', 'password-0')

      const studyUrl = await createStudy(page, studyName)
      await expect(page.getByText(studyName)).toBeVisible({ timeout: 10000 })

      await page.goto(studyUrl)
      await deleteCurrentStudy(page, studyName)
    })

    test('should create a study as BC Gestionnaire', async ({ page }) => {
      test.setTimeout(90000)

      const studyName = `BC Gestionnaire study ${suffix}`
      await login(page, 'bc-gestionnaire-0@yopmail.com', 'password-0')

      const studyUrl = await createStudy(page, studyName)
      await expect(page.getByText(studyName)).toBeVisible({ timeout: 10000 })

      await page.goto(studyUrl)
      await deleteCurrentStudy(page, studyName)
    })
  })

  test.describe('CUT environment', () => {
    test('should create a study as CUT Admin', async ({ page }) => {
      test.setTimeout(90000)

      const studyName = `CUT Admin study ${suffix}`
      await login(page, 'cut-env-admin-0@yopmail.com', 'password-0')

      await page.goto('/count/etudes/creer')

      await page.getByTestId('organization-sites-checkbox').first().locator('input').click({ force: true })
      await page.getByTestId('new-study-organization-button').click()

      await page.getByTestId('new-study-name').locator('input').fill(studyName)

      const createResponse = page.waitForResponse(
        (r) => r.url().includes('/etudes/creer') && r.request().method() === 'POST',
      )
      await page.getByTestId('new-study-create-button').click()
      await createResponse

      await expect(page).toHaveURL(/\/etudes\/[a-f0-9-]{36}/, { timeout: 15000 })
      await expect(page.getByText(studyName)).toBeVisible({ timeout: 10000 })

      // Delete: CUT redirects to /count after deletion
      await page.getByTestId('delete-study').click()
      await expect(page.locator('#delete-study-modal-title')).toBeVisible()
      await page.getByTestId('delete-study-name-field').locator('input').fill(studyName)
      const deleteResponse = page.waitForResponse(
        (r) => r.url().includes('/etudes/') && r.request().method() === 'POST',
      )
      await page.getByTestId('confirm-study-deletion').click()
      await deleteResponse
      await expect(page).toHaveURL(/\//, { timeout: 15000 })
    })
  })

  test.describe('Admin user default role', () => {
    test('admin user default role is validator', async ({ page }) => {
      test.setTimeout(90000)

      const studyName = `Study from admin ${suffix}`
      await login(page, 'bc-admin-0@yopmail.com', 'password-0')

      const studyUrl = await createStudy(page, studyName)
      const studyId = studyUrl.match(/\/etudes\/([a-f0-9-]{36})/)?.[1]

      await page.goto(`/etudes/${studyId}/cadrage`)

      const adminRow = page.getByTestId('study-rights-table-row').filter({ hasText: 'bc-admin-0@yopmail.com' })
      await expect(adminRow).toBeVisible({ timeout: 10000 })
      await expect(adminRow).toContainText('Validateur')

      await page.goto(studyUrl)
      await deleteCurrentStudy(page, studyName)
    })

    test('non-admin user default role is editor', async ({ page }) => {
      test.setTimeout(90000)

      const studyName = `Study from collaborator ${suffix}`
      await login(page, 'bc-collaborator-0@yopmail.com', 'password-0')

      const studyUrl = await createStudy(page, studyName)
      const studyId = studyUrl.match(/\/etudes\/([a-f0-9-]{36})/)?.[1]

      await page.goto(`/etudes/${studyId}/cadrage`)

      const collaboratorRow = page
        .getByTestId('study-rights-table-row')
        .filter({ hasText: 'bc-collaborator-0@yopmail.com' })
      await expect(collaboratorRow).toBeVisible({ timeout: 10000 })
      await expect(collaboratorRow).toContainText('Éditeur')

      await page.goto(studyUrl)
      await deleteCurrentStudy(page, studyName)
    })
  })
})
