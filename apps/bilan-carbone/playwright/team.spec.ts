import { expect, test, type Locator, type Page } from '@playwright/test'
import { login } from './playwright.helpers'

const rowByEmail = (page: Page, email: string): Locator =>
  page.getByTestId('team-table-row').filter({ hasText: email }).first()

const selectRole = async (page: Page, row: Locator, targetValue: string) => {
  await row.getByRole('combobox').click()
  const popover = page.locator('.MuiPopover-root')
  await expect(popover).toBeVisible({ timeout: 5000 })
  const option = popover.locator(`[data-value="${targetValue}"]`)
  await expect(option).toBeVisible({ timeout: 5000 })
  const responsePromise = page.waitForResponse(
    (r) => r.url().includes('/equipe') && r.request().method() === 'POST',
    { timeout: 15000 },
  )
  await option.click({ force: true })
  await responsePromise
  await page.keyboard.press('Escape')
}

test.describe('Team', () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage()
    await login(page, 'bc-admin-1@yopmail.com', 'password-1')
    await page.goto('/equipe')

    const collaboratorRow = rowByEmail(page, 'bc-collaborator-1@yopmail.com')
    await expect(collaboratorRow).toBeVisible()
    const currentRole = await collaboratorRow.locator('input').inputValue()
    if (currentRole !== 'COLLABORATOR') {
      await selectRole(page, collaboratorRow, 'COLLABORATOR')
      await page.reload()
      await expect(rowByEmail(page, 'bc-collaborator-1@yopmail.com').locator('input')).toHaveValue('COLLABORATOR')
    }

    await page.close()
  })

  test('admins can edit team member role', async ({ page }) => {
    await login(page, 'bc-admin-1@yopmail.com', 'password-1')
    await page.goto('/equipe')
    await expect(page.getByTestId('team-table-row').first().locator('input')).toBeVisible()
  })

  test('super-admins can edit team member role', async ({ page }) => {
    await login(page, 'bc-super_admin-1@yopmail.com', 'password-1')
    await page.goto('/equipe')
    await expect(page.getByTestId('team-table-row').first().locator('input')).toBeVisible()
  })

  test('gestionnaires can edit team member role', async ({ page }) => {
    await login(page, 'bc-gestionnaire-1@yopmail.com', 'password-1')
    await page.goto('/equipe')
    await expect(page.getByTestId('team-table-row').first().locator('input')).toBeVisible()
  })

  test('collaborators cannot edit team member role', async ({ page }) => {
    await login(page, 'bc-collaborator-1@yopmail.com', 'password-1')
    await page.goto('/equipe')
    await expect(page.getByTestId('team-table-row').first().locator('input')).toHaveCount(0)
  })

  test('members cannot edit team member role', async ({ page }) => {
    await login(page, 'bc-default-1@yopmail.com', 'password-1')
    await page.goto('/equipe')
    await expect(page.getByTestId('team-table-row').first().locator('input')).toHaveCount(0)
  })

  test('should display correct roles in the team table', async ({ page }) => {
    await login(page, 'bc-admin-1@yopmail.com', 'password-1')
    await page.goto('/equipe')

    const adminRow = rowByEmail(page, 'bc-admin-1@yopmail.com')
    await expect(adminRow).toBeVisible()
    await expect(adminRow.locator('input')).toHaveValue('ADMIN')
    await expect(adminRow.locator('input')).not.toBeDisabled()

    const collaboratorRow = rowByEmail(page, 'bc-collaborator-1@yopmail.com')
    await expect(collaboratorRow).toBeVisible()
    await expect(collaboratorRow.locator('input')).toHaveValue('COLLABORATOR')
    await expect(collaboratorRow.locator('input')).not.toBeDisabled()

    const defaultRow = rowByEmail(page, 'bc-default-1@yopmail.com')
    await expect(defaultRow).toBeVisible()
    await expect(defaultRow.locator('input')).toHaveValue('DEFAULT')
    await expect(defaultRow.locator('input')).not.toBeDisabled()

    const gestionnaireRow = rowByEmail(page, 'bc-gestionnaire-1@yopmail.com')
    await expect(gestionnaireRow).toBeVisible()
    await expect(gestionnaireRow.locator('input')).toHaveValue('GESTIONNAIRE')
    await expect(gestionnaireRow.locator('input')).not.toBeDisabled()

    const superAdminRow = rowByEmail(page, 'bc-super_admin-1@yopmail.com')
    await expect(superAdminRow).toBeVisible()
    await expect(superAdminRow.locator('input')).toHaveValue('SUPER_ADMIN')
    await expect(superAdminRow.locator('input')).toBeDisabled()
  })

  test('should change a member role and revert it', async ({ page }) => {
    test.setTimeout(60000)

    await login(page, 'bc-admin-1@yopmail.com', 'password-1')
    await page.goto('/equipe')

    const collaboratorRow = rowByEmail(page, 'bc-collaborator-1@yopmail.com')
    await expect(collaboratorRow).toBeVisible()

    // Ensure the role starts as COLLABORATOR (in case a previous run left it in another state)
    const currentRole = await collaboratorRow.locator('input').inputValue()
    if (currentRole !== 'COLLABORATOR') {
      await selectRole(page, collaboratorRow, 'COLLABORATOR')
      await page.reload()
      await expect(rowByEmail(page, 'bc-collaborator-1@yopmail.com')).toBeVisible()
    }
    await expect(rowByEmail(page, 'bc-collaborator-1@yopmail.com').locator('input')).toHaveValue('COLLABORATOR')

    // Change to GESTIONNAIRE
    await selectRole(page, rowByEmail(page, 'bc-collaborator-1@yopmail.com'), 'GESTIONNAIRE')
    await page.reload()
    await expect(rowByEmail(page, 'bc-collaborator-1@yopmail.com')).toBeVisible()
    await expect(rowByEmail(page, 'bc-collaborator-1@yopmail.com').locator('input')).toHaveValue('GESTIONNAIRE')

    // Revert back to COLLABORATOR so the test is repeatable
    await selectRole(page, rowByEmail(page, 'bc-collaborator-1@yopmail.com'), 'COLLABORATOR')
    await page.reload()
    await expect(rowByEmail(page, 'bc-collaborator-1@yopmail.com').locator('input')).toHaveValue('COLLABORATOR')
  })
})
