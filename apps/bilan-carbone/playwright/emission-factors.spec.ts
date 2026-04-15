import { expect, test } from '@playwright/test'
import { login } from './playwright.helpers'

test.describe('Emission factors table', () => {
  test('should be able to display archived emission factors', async ({ page }) => {
    await login(page, 'bc-collaborator-0@yopmail.com', 'password-0')
    await page.goto('/facteurs-d-emission')

    // Archived switch is off by default
    await expect(page.getByTestId('archived-emissions-factors-switch').locator('input')).not.toBeChecked()

    // Search for archived factor — should find nothing when switch is off
    await page.getByTestId('emission-factor-search-input').locator('input').fill('Archived')
    await expect(page.getByTestId('cell-emission-name')).toHaveCount(0)

    // Clear and enable archived switch
    await page.getByTestId('emission-factor-search-input').locator('input').clear()
    await page.getByTestId('archived-emissions-factors-switch').locator('input').click()

    // Now search should find the archived factor
    await page.getByTestId('emission-factor-search-input').locator('input').fill('Archived')
    await expect(page.getByTestId('cell-emission-name')).toHaveCount(1)
    await expect(page.getByTestId('cell-emission-name').first()).toHaveText('FE Test Archived')
  })
})
