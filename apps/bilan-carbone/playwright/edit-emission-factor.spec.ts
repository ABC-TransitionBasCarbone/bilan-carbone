import { expect, test } from '@playwright/test'
import { login } from './playwright.helpers'

/**
 * These tests create a factor, edit it, then delete it — fully self-contained.
 */
test.describe('Edit emission factor', () => {
  test('should be able to edit and delete an emission factor', async ({ page }) => {
    test.setTimeout(90000)

    await login(page, 'bc-collaborator-0@yopmail.com', 'password-0')

    // --- Create a factor to edit ---
    await page.goto('/facteurs-d-emission/creer')
    await page.getByTestId('emission-factor-name').locator('input').fill('My FE to edit (pw)')
    await page.getByTestId('emission-factor-unit').click()
    await page.locator('[data-value="GWH"]').click()
    await page.getByTestId('emission-factor-source').locator('input').fill('Source')

    await page.getByTestId('emission-factor-detailed-switch').click()
    await page.getByTestId('emission-factor-multiple-switch').click()
    await page.getByTestId('emission-factor-parts-count').locator('input').fill('2')

    await page.getByTestId('emission-part-0-expand').click()
    await page.getByTestId('emission-factor-part-0-name').locator('input').fill('My first part')
    await page.getByTestId('emission-factor-part-0-type').click()
    await page.locator('[data-value="Amont"]').click()
    for (const [field, value] of Object.entries({ co2f: '1', ch4f: '2', ch4b: '3', n2o: '4', co2b: '5', sf6: '6', hfc: '7', pfc: '8', otherGES: '9' })) {
      await page.getByTestId(`emission-factor-part-0-${field}`).locator('input').fill(value)
    }

    await page.getByTestId('emission-part-1-expand').click()
    await page.getByTestId('emission-factor-part-1-name').locator('input').fill('My second part')
    await page.getByTestId('emission-factor-part-1-type').click()
    await page.locator('[data-value="Combustion"]').click()
    for (const [field, value] of Object.entries({ co2f: '10', ch4f: '10', ch4b: '10', n2o: '10', co2b: '10', sf6: '10', hfc: '10', pfc: '10', otherGES: '10' })) {
      await page.getByTestId(`emission-factor-part-1-${field}`).locator('input').fill(value)
    }

    await page.getByTestId('emission-source-quality-select').click()
    await page.locator('[data-value="5"]').click()
    await page.getByTestId('emission-factor-post').click()
    await page.locator('[data-value="Energies"]').click()
    await page.getByTestId('emission-factor-subPost').click()
    await page.locator('[data-value="CombustiblesOrganiques"]').click()
    await page.keyboard.press('Escape')

    const createResponse = page.waitForResponse(
      (r) => r.url().includes('/facteurs-d-emission/creer') && r.request().method() === 'POST',
    )
    await page.getByTestId('emission-factor-valid-button').click()
    await createResponse

    // --- Edit the factor ---
    await page.getByTestId('emission-factor-search-input').locator('input').fill('My FE to edit (pw)')
    await expect(page.getByTestId('cell-emission-name').first()).toHaveText('My FE to edit (pw)')

    await page.getByTestId('edit-emission-factor-button').first().click()
    await expect(page.locator('#edit-emission-factor-modal-title')).toBeVisible()
    await page.getByTestId('edit-emission-factor-confirm').click()
    await expect(page).toHaveURL(/\/facteurs-d-emission\/[0-9a-fA-F-]{36}\/modifier/)

    // Verify original values
    await expect(page.getByTestId('emission-factor-detailed-switch').locator('input')).toBeChecked()
    await expect(page.getByTestId('emission-factor-multiple-switch').locator('input')).toBeChecked()
    await expect(page.getByTestId('emission-factor-name').locator('input')).toHaveValue('My FE to edit (pw)')
    await expect(page.getByTestId('emission-factor-unit').locator('input')).toHaveValue('GWH')
    await expect(page.getByTestId('emission-factor-parts-count').locator('input')).toHaveValue('2')
    await expect(page.getByTestId('emission-factor-subPost')).toContainText('Combustibles organiques')

    // Edit: rename and change unit
    await page.getByTestId('emission-factor-name').locator('input').fill('My FE to edit (pw) - EDITED')
    await page.getByTestId('emission-factor-unit').click()
    await page.locator('[data-value="GO"]').click()

    // Delete the first part
    const partRows = page.getByTestId('emission-part-row')
    const firstPartIndex = await partRows.evaluateAll((rows) =>
      rows.findIndex((r) => r.textContent?.includes('My first part')),
    )
    if (firstPartIndex >= 0) {
      await page.getByTestId(`delete-emission-part-${firstPartIndex}`).click()
    }

    // Edit the remaining part
    await page.getByTestId('emission-part-0-expand').click()
    await page.getByTestId('emission-factor-part-0-name').locator('input').fill(' - EDITED')
    for (const field of ['co2f', 'ch4f', 'ch4b', 'n2o', 'co2b', 'sf6', 'hfc', 'pfc', 'otherGES']) {
      await page.getByTestId(`emission-factor-part-0-${field}`).locator('input').fill('0')
    }

    await page.getByTestId('emission-factor-post').click()
    await page.locator('[data-value="Deplacements"]').click()
    await page.getByTestId('emission-factor-subPost').nth(1).click()
    await page.locator('[data-value="DeplacementsDomicileTravail"]').click()
    await page.keyboard.press('Escape')

    const updateResponse = page.waitForResponse(
      (r) => r.url().includes('/facteurs-d-emission/') && r.url().includes('/modifier') && r.request().method() === 'POST',
    )
    await page.getByTestId('emission-factor-valid-button').click()
    await updateResponse

    await expect(page).toHaveURL(`${new URL(page.url()).origin}/facteurs-d-emission`)
    await page.getByTestId('emission-factor-search-input').locator('input').fill('My FE to edit (pw) - EDITED')
    await expect(page.getByTestId('cell-emission-name').first()).toHaveText('My FE to edit (pw) - EDITED', { timeout: 10000 })
    await expect(page.getByTestId('cell-emission-Valeur').first()).toHaveText('0 kgCO₂e/Go')

    // --- Delete the factor ---
    await page.getByTestId('delete-emission-factor-button').first().click()
    await expect(page.locator('#delete-emission-factor-modal-title')).toBeVisible()
    await page.getByTestId('delete-emission-factor-confirm').click()
    await expect(page.locator('#delete-emission-factor-modal-title')).toHaveCount(0, { timeout: 10000 })
  })
})
