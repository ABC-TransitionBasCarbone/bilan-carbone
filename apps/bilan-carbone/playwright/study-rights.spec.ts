import { expect, test, type Page } from '@playwright/test'
import { createStudy, deleteCurrentStudy, login, logout } from './playwright.helpers'

const suffix = `(playwright-${Date.now()})`

const addStudyRight = async (
  page: Page,
  email: string,
  role: string,
  { expectModal = false, acceptModal = true } = {},
) => {
  await page.getByTestId('study-rights-change-button').click()
  await expect(page).toHaveURL(/\/cadrage\/ajouter/, { timeout: 10000 })

  const emailInput = page.getByTestId('study-rights-email').locator('input')
  await emailInput.fill(email)
  // If the user is in the org, an autocomplete option may appear — select it
  const option = page.locator('[data-option-index]').filter({ hasText: email }).first()
  const optionVisible = await option.isVisible({ timeout: 2000 }).catch(() => false)
  if (optionVisible) {
    await option.click()
  }

  await page.getByTestId('study-rights-role').click()
  await page.locator(`[data-value="${role}"]`).click()

  await page.getByTestId('study-rights-create-button').click()

  if (expectModal) {
    await expect(page.locator('#new-study-right-modal-title')).toBeVisible({ timeout: 5000 })
    if (!acceptModal) {
      await page.getByTestId('new-study-right-modal-decline').click()
      return
    }
    const responsePromise = page.waitForResponse(
      (r) => r.url().includes('/cadrage') && r.request().method() === 'POST',
      { timeout: 20000 },
    )
    await page.getByTestId('new-study-right-modal-accept').click()
    await responsePromise
  }

  await expect(page).toHaveURL(/\/cadrage$/, { timeout: 15000 })
}

test.describe('Study rights', () => {
  test('should set role according to given rights (admin)', async ({ page }) => {
    test.setTimeout(120000)

    const studyName = `Study with rights ${suffix}`
    await login(page, 'bc-admin-1@yopmail.com', 'password-1')
    const studyUrl = await createStudy(page, studyName)
    const studyId = studyUrl.match(/\/etudes\/([a-f0-9-]{36})/)?.[1]!

    await page.goto(`/etudes/${studyId}/cadrage`)

    // Admin user's own row should show Validateur (admin default is validator)
    const adminRow = page.getByTestId('study-rights-table-row').filter({ hasText: 'bc-admin-1@yopmail.com' })
    await expect(adminRow).toBeVisible({ timeout: 10000 })
    await expect(adminRow).toContainText('Validateur')
    // Admin cannot edit their own row
    await expect(adminRow.locator('[data-testid="select-study-role"] input')).toBeDisabled()

    // Add bc-collaborator-1 as Validator (same org)
    await addStudyRight(page, 'bc-collaborator-1@yopmail.com', 'Validator')
    const collaboratorRow = page.getByTestId('study-rights-table-row').filter({ hasText: 'bc-collaborator-1@yopmail.com' })
    await expect(collaboratorRow).toBeVisible({ timeout: 10000 })
    await expect(collaboratorRow).toContainText('Validateur')
    // Validator from same org can be edited
    await expect(collaboratorRow.locator('[data-testid="select-study-role"] input')).not.toBeDisabled()

    // Change collaborator-1 from Validator to Editor via select
    await collaboratorRow.locator('[data-testid="select-study-role"]').click()
    const popover = page.locator('.MuiPopover-root')
    await expect(popover).toBeVisible({ timeout: 5000 })
    const changeResponse = page.waitForResponse(
      (r) => r.url().includes('/etudes/') && r.request().method() === 'POST',
      { timeout: 15000 },
    )
    await popover.locator('[data-value="Editor"]').click()
    await changeResponse
    await expect(collaboratorRow).toContainText('Éditeur', { timeout: 10000 })

    // Cleanup
    await page.goto(studyUrl)
    await deleteCurrentStudy(page, studyName)
  })

  test('study members deletion rights', async ({ page }) => {
    test.setTimeout(120000)

    const studyName = `Study with deletion rights ${suffix}`
    await login(page, 'bc-admin-1@yopmail.com', 'password-1')
    const studyUrl = await createStudy(page, studyName)
    const studyId = studyUrl.match(/\/etudes\/([a-f0-9-]{36})/)?.[1]!

    await page.goto(`/etudes/${studyId}/cadrage`)

    // Add bc-collaborator-1 as validator
    await addStudyRight(page, 'bc-collaborator-1@yopmail.com', 'Validator')

    // Add bc-gestionnaire-1 as reader
    await addStudyRight(page, 'bc-gestionnaire-1@yopmail.com', 'Reader')

    const rows = page.getByTestId('study-rights-table-row')
    await expect(rows).toHaveCount(3, { timeout: 10000 })

    // Admin cannot delete their own row (no delete button on self row)
    const adminRow = rows.filter({ hasText: 'bc-admin-1@yopmail.com' })
    await expect(adminRow.getByTestId('delete-study-member-button')).toHaveCount(0)

    // Collaborator-1 (validator) can be deleted
    const collaboratorRow = rows.filter({ hasText: 'bc-collaborator-1@yopmail.com' })
    await expect(collaboratorRow.getByTestId('delete-study-member-button')).toBeVisible()

    // Cancel deletion modal
    await collaboratorRow.getByTestId('delete-study-member-button').click()
    await expect(page.locator('#study-member-deletion-modal-description')).toBeVisible()
    await expect(page.locator('#study-member-deletion-modal-description')).toContainText('bc-collaborator-1@yopmail.com')
    await page.getByTestId('study-member-cancel-deletion').click()
    await expect(page.locator('#study-member-deletion-modal-description')).toHaveCount(0)
    await expect(rows).toHaveCount(3)

    // Confirm deletion
    await collaboratorRow.getByTestId('delete-study-member-button').click()
    await expect(page.locator('#study-member-deletion-modal-description')).toBeVisible()
    const deleteResponse = page.waitForResponse(
      (r) => r.url().includes('/etudes/') && r.request().method() === 'POST',
      { timeout: 15000 },
    )
    await page.getByTestId('study-member-confirm-deletion').click()
    await deleteResponse
    await expect(rows).toHaveCount(2, { timeout: 10000 })

    // Remaining member is gestionnaire-1
    const gestionnaireRow = rows.filter({ hasText: 'bc-gestionnaire-1@yopmail.com' })
    await expect(gestionnaireRow).toBeVisible()

    // bc-gestionnaire-1 as Reader cannot delete members
    const cadragePage = page.url()
    await logout(page)
    await login(page, 'bc-gestionnaire-1@yopmail.com', 'password-1')
    await page.goto(cadragePage)
    await expect(page.getByTestId('delete-study-member-button')).toHaveCount(0)

    // Cleanup
    await logout(page)
    await login(page, 'bc-admin-1@yopmail.com', 'password-1')
    await page.goto(studyUrl)
    await deleteCurrentStudy(page, studyName)
  })

  test('editors cannot select validator role', async ({ page }) => {
    test.setTimeout(120000)

    const studyName = `Study editor rights check ${suffix}`
    await login(page, 'bc-admin-1@yopmail.com', 'password-1')
    const studyUrl = await createStudy(page, studyName)
    const studyId = studyUrl.match(/\/etudes\/([a-f0-9-]{36})/)?.[1]!

    await page.goto(`/etudes/${studyId}/cadrage`)

    // Add bc-collaborator-0 as editor (different org member)
    await addStudyRight(page, 'bc-collaborator-0@yopmail.com', 'Editor', { expectModal: true })

    const cadragePage = page.url()
    await logout(page)
    await login(page, 'bc-collaborator-0@yopmail.com', 'password-0')
    await page.goto(cadragePage)

    // Study-rights-change-button should exist (editor can add members)
    await expect(page.getByTestId('study-rights-change-button')).toBeVisible({ timeout: 10000 })

    // Admin row (validator) — editor cannot change validator role
    const adminRow = page.getByTestId('study-rights-table-row').filter({ hasText: 'bc-admin-1@yopmail.com' })
    await expect(adminRow).toBeVisible()
    await expect(adminRow.locator('[data-testid="select-study-role"] input')).toBeDisabled()

    // Open role select for collaborator-0 (themselves)
    const selfRow = page.getByTestId('study-rights-table-row').filter({ hasText: 'bc-collaborator-0@yopmail.com' })
    await expect(selfRow).toBeVisible()
    // Self row: disabled (can't edit own role)
    await expect(selfRow.locator('[data-testid="select-study-role"] input')).toBeDisabled()

    // Cleanup
    await logout(page)
    await login(page, 'bc-admin-1@yopmail.com', 'password-1')
    await page.goto(studyUrl)
    await deleteCurrentStudy(page, studyName)
  })

  test('readers cannot manage rights', async ({ page }) => {
    test.setTimeout(120000)

    const studyName = `Study reader rights check ${suffix}`
    await login(page, 'bc-admin-1@yopmail.com', 'password-1')
    const studyUrl = await createStudy(page, studyName)
    const studyId = studyUrl.match(/\/etudes\/([a-f0-9-]{36})/)?.[1]!

    await page.goto(`/etudes/${studyId}/cadrage`)

    // Add bc-default-1 as Reader
    await addStudyRight(page, 'bc-default-1@yopmail.com', 'Reader')

    const cadragePage = page.url()
    await logout(page)
    await login(page, 'bc-default-1@yopmail.com', 'password-1')
    await page.goto(cadragePage)

    // Reader cannot add members
    await expect(page.getByTestId('study-rights-change-button')).toHaveCount(0)
    // Reader sees roles as text, not selects
    await expect(page.getByTestId('select-study-role')).toHaveCount(0)

    // Cleanup
    await logout(page)
    await login(page, 'bc-admin-1@yopmail.com', 'password-1')
    await page.goto(studyUrl)
    await deleteCurrentStudy(page, studyName)
  })
})
