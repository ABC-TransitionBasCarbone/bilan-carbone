import { expect, test } from '@playwright/test'

const studyName = 'BC V8.10'

const loginAsMultiEnvAdmin = async (page: Parameters<Parameters<typeof test>[1]>[0]) => {
  await page.goto('/login')
  await page.locator('[data-testid="input-email"] input').fill('all-env-admin-0@yopmail.com')
  await page.locator('[data-testid="input-password"] input').fill('password-0')
  await page.getByTestId('login-button').click()
  await expect(page).toHaveURL(/\/selection-du-compte/, { timeout: 30000 })
}

const deleteAllDuplicatesInTilt = async (page: Parameters<Parameters<typeof test>[1]>[0]) => {
  await page.goto('/selection-du-compte')
  await page.locator('li').filter({ hasText: 'Tilt' }).click()
  await expect(page).toHaveURL(/\/$/, { timeout: 10000 })

  while (true) {
    const cards = page.getByTestId('study').filter({ hasText: studyName })
    const count = await cards.count()
    if (count === 0) {
      break
    }
    await cards.first().scrollIntoViewIfNeeded()
    await cards.first().getByTestId('study-link').click()
    const studyUrl = page.url()
    const studyPath = new URL(studyUrl).pathname.split('/').slice(0, 3).join('/')
    await page.goto(studyPath)
    await page.getByTestId('delete-study').click()
    await expect(page.locator('#delete-study-modal-title')).toBeVisible()
    await page.getByTestId('delete-study-name-field').locator('input').fill(studyName)
    const deleteResponse = page.waitForResponse((r) => r.url().includes('/etudes/') && r.request().method() === 'POST')
    await page.getByTestId('confirm-study-deletion').click()
    await deleteResponse
    await expect(page).toHaveURL(/\/$/, { timeout: 10000 })
  }
}

test.describe('Duplicate study', () => {
  test('should be able to duplicate a study to another environment', async ({ page }) => {
    test.setTimeout(120000)

    await loginAsMultiEnvAdmin(page)

    // Clean up any leftover duplicates in Tilt from previous runs
    await deleteAllDuplicatesInTilt(page)

    // Navigate back to BC+ and open the source study
    await page.goto('/selection-du-compte')
    await page.locator('li').filter({ hasText: 'BC+' }).click()
    await expect(page).toHaveURL(/\/$/, { timeout: 10000 })

    const studyCard = page.getByTestId('study').filter({ hasText: studyName }).first()
    await studyCard.scrollIntoViewIfNeeded()
    await studyCard.getByTestId('study-link').click()

    await page.getByTestId('duplicate-study').click()
    await expect(page.locator('#duplicate-study-modal-title')).toBeVisible()
    await expect(page.locator('#duplicate-study-modal-description')).toBeVisible()
    await expect(page.getByTestId('duplication-modale-text')).toContainText('Vous serez redirigé vers la page')

    await page.getByTestId('environment-selector').click()
    await page.locator('[data-value="TILT"]').click()
    await expect(page.getByTestId('duplication-modale-text')).toContainText('Tilt')
    await page.getByTestId('duplicate-study-confirm').click()
    await expect(page.locator('#duplicate-study-modal-title')).toHaveCount(0, { timeout: 30000 })

    // Switch to Tilt and verify duplication
    await page.goto('/selection-du-compte')
    await page.locator('li').filter({ hasText: 'Tilt' }).click()
    await expect(page).toHaveURL(/\/$/, { timeout: 10000 })

    const duplicatedCard = page.getByTestId('study').filter({ hasText: studyName }).first()
    await duplicatedCard.scrollIntoViewIfNeeded()
    await expect(duplicatedCard).toBeVisible()
    await duplicatedCard.getByTestId('study-link').click()

    await expect(page.getByTestId('withDep-total-result')).toContainText('280', { timeout: 15000 })
    await expect(page.getByTestId('withoutDep-total-result')).toContainText('280')
    await page.getByTestId('results-monetary-ratio').scrollIntoViewIfNeeded()
    await expect(page.getByTestId('results-monetary-ratio')).toContainText('36,99')

    // Cleanup: delete the duplicated study in Tilt so the test is repeatable
    const studyUrl = page.url()
    const studyPath = new URL(studyUrl).pathname.split('/').slice(0, 3).join('/')
    await page.goto(studyPath)
    await page.getByTestId('delete-study').click()
    await expect(page.locator('#delete-study-modal-title')).toBeVisible()
    await page.getByTestId('delete-study-name-field').locator('input').fill(studyName)
    const deleteResponse = page.waitForResponse((r) => r.url().includes('/etudes/') && r.request().method() === 'POST')
    await page.getByTestId('confirm-study-deletion').click()
    await deleteResponse
    await expect(page).toHaveURL(/\/$/, { timeout: 10000 })
  })
})
