import { expect, test } from '@playwright/test'
import { deleteEmissionFactor, login } from './playwright.helpers'

test.describe('Create emission factor', () => {
  test('should create an emission factor with total CO2 on your organization', async ({ page }) => {
    test.setTimeout(60000)

    await login(page, 'bc-collaborator-0@yopmail.com', 'password-0')
    await page.goto('/facteurs-d-emission/creer')

    await page.getByTestId('emission-factor-name').locator('input').fill('My new FE')
    await page.getByTestId('emission-factor-unit').click()
    await page.locator('[data-value="GWH"]').click()
    await page.getByTestId('emission-factor-source').locator('input').fill('Magic')
    await page.getByTestId('emission-factor-totalCo2').locator('input').fill('12')
    await page.getByTestId('emission-source-quality-select').click()
    await page.locator('[data-value="5"]').click()

    // Base field should NOT appear unless subpost includes Electricite
    await expect(page.getByTestId('emission-factor-base')).toHaveCount(0)

    await page.getByTestId('emission-factor-post').click()
    await page.locator('[data-value="Energies"]').click()
    await page.getByTestId('emission-factor-subPost').click()
    await page.locator('[data-value="Electricite"]').click()
    await page.keyboard.press('Escape')

    await expect(page.getByTestId('emission-factor-base')).toBeVisible()
    await page.getByTestId('emission-factor-base').click()
    await page.locator('[data-value="LocationBased"]').click()

    const createResponse = page.waitForResponse(
      (r) => r.url().includes('/facteurs-d-emission/creer') && r.request().method() === 'POST',
    )
    await page.getByTestId('emission-factor-valid-button').click()
    await createResponse

    await expect(page).toHaveURL(`${new URL(page.url()).origin}/facteurs-d-emission`)

    await page.getByTestId('emission-factor-search-input').locator('input').fill('My new FE')
    await expect(page.getByTestId('cell-emission-name').first()).toHaveText('My new FE')
    await expect(page.getByTestId('cell-emission-Valeur').first()).toHaveText('12 kgCO₂e/GWh')

    // Cleanup
    await deleteEmissionFactor(page, 'My new FE')
  })

  test('should create an emission factor with detailed CO2', async ({ page }) => {
    test.setTimeout(60000)

    await login(page, 'bc-collaborator-0@yopmail.com', 'password-0')
    await page.goto('/facteurs-d-emission/creer')

    await page.getByTestId('emission-factor-name').locator('input').fill('My new detailed FE')
    await page.getByTestId('emission-factor-unit').click()
    await page.locator('[data-value="GWH"]').click()
    await page.getByTestId('emission-factor-source').locator('input').fill('Magic')

    // Detailed GES fields are hidden by default
    for (const field of ['co2f', 'ch4f', 'ch4b', 'n2o', 'co2b', 'sf6', 'hfc', 'pfc', 'otherGES']) {
      await expect(page.getByTestId(`emission-factor-${field}`)).toHaveCount(0)
    }
    await expect(page.getByTestId('emission-factor-detailed-switch').locator('input')).not.toBeChecked()
    await page.getByTestId('emission-factor-detailed-switch').click()

    const values: Record<string, string> = {
      co2f: '1',
      ch4f: '2',
      ch4b: '3',
      n2o: '4',
      co2b: '5',
      sf6: '6',
      hfc: '7',
      pfc: '8',
      otherGES: '9',
    }
    for (const [field, value] of Object.entries(values)) {
      await page.getByTestId(`emission-factor-${field}`).locator('input').fill(value)
    }

    await expect(page.getByTestId('emission-factor-totalCo2').locator('input')).toBeDisabled()
    await expect(page.getByTestId('emission-factor-totalCo2').locator('input')).toHaveValue('37')

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

    await page.getByTestId('emission-factor-search-input').locator('input').fill('My new detailed FE')
    await expect(page.getByTestId('cell-emission-name').first()).toHaveText('My new detailed FE')
    await expect(page.getByTestId('cell-emission-Valeur').first()).toHaveText('37 kgCO₂e/GWh')

    await deleteEmissionFactor(page, 'My new detailed FE')
  })

  test('should create an emission factor with total CO2 and multiple parts', async ({ page }) => {
    test.setTimeout(60000)

    await login(page, 'bc-collaborator-0@yopmail.com', 'password-0')
    await page.goto('/facteurs-d-emission/creer')

    await page.getByTestId('emission-factor-name').locator('input').fill('My new multiple FE')
    await page.getByTestId('emission-factor-unit').click()
    await page.locator('[data-value="GWH"]').click()
    await page.getByTestId('emission-factor-source').locator('input').fill('Magic')

    await expect(page.getByTestId('emission-factor-multiple-switch').locator('input')).not.toBeChecked()
    await page.getByTestId('emission-factor-multiple-switch').click()

    await page.getByTestId('emission-factor-parts-count').locator('input').fill('3')
    await expect(page.getByTestId('emission-part-0-header')).toBeVisible()
    await expect(page.getByTestId('emission-part-1-header')).toBeVisible()
    await expect(page.getByTestId('emission-part-2-header')).toBeVisible()

    await page.getByTestId('emission-part-0-expand').click()
    await page.getByTestId('emission-factor-part-0-name').locator('input').fill('My first part')
    await page.getByTestId('emission-factor-part-0-type').click()
    await page.locator('[data-value="Amont"]').click()
    await page.getByTestId('emission-factor-part-0-totalCo2').locator('input').fill('3')

    await page.getByTestId('emission-part-1-expand').click()
    await page.getByTestId('emission-factor-part-1-name').locator('input').fill('My second part')
    await page.getByTestId('emission-factor-part-1-type').click()
    await page.locator('[data-value="Combustion"]').click()
    await page.getByTestId('emission-factor-part-1-totalCo2').locator('input').fill('6')

    await page.getByTestId('emission-part-2-expand').click()
    await page.getByTestId('emission-factor-part-2-name').locator('input').fill('My first part')
    await page.getByTestId('emission-factor-part-2-type').click()
    await page.locator('[data-value="Incineration"]').click()
    await page.getByTestId('emission-factor-part-2-totalCo2').locator('input').fill('12')

    await expect(page.getByTestId('emission-part-0-header')).toHaveText('My first part')
    await expect(page.getByTestId('emission-part-1-header')).toHaveText('My second part')
    await expect(page.getByTestId('emission-part-2-header')).toHaveText('My first part')
    await expect(page.getByTestId('emission-factor-totalCo2').locator('input')).toHaveValue('21')

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

    await page.getByTestId('emission-factor-search-input').locator('input').fill('My new multiple FE')
    await expect(page.getByTestId('cell-emission-name').first()).toHaveText('My new multiple FE')
    await expect(page.getByTestId('cell-emission-Valeur').first()).toHaveText('21 kgCO₂e/GWh')

    await deleteEmissionFactor(page, 'My new multiple FE')
  })

  test('should create an emission factor with detailed CO2 and multiple parts', async ({ page }) => {
    test.setTimeout(60000)

    await login(page, 'bc-collaborator-0@yopmail.com', 'password-0')
    await page.goto('/facteurs-d-emission/creer')

    await page.getByTestId('emission-factor-name').locator('input').fill('My new multiple detailed FE')
    await page.getByTestId('emission-factor-unit').click()
    await page.locator('[data-value="GWH"]').click()
    await page.getByTestId('emission-factor-source').locator('input').fill('Magic')

    await page.getByTestId('emission-factor-detailed-switch').click()
    await page.getByTestId('emission-factor-multiple-switch').click()
    await expect(page.getByTestId('emission-part-1-header')).toHaveCount(0)

    await page.getByTestId('emission-factor-parts-count').locator('input').fill('2')
    await expect(page.getByTestId('emission-part-0-header')).toHaveText('Composante 1')
    await expect(page.getByTestId('emission-part-1-header')).toHaveText('Composante 2')
    await expect(page.getByTestId('emission-part-2-header')).toHaveCount(0)

    const part0Fields: Record<string, string> = {
      co2f: '1', ch4f: '2', ch4b: '3', n2o: '4', co2b: '5', sf6: '6', hfc: '7', pfc: '8', otherGES: '9',
    }
    await page.getByTestId('emission-part-0-expand').click()
    await page.getByTestId('emission-factor-part-0-name').locator('input').fill('My first part')
    await page.getByTestId('emission-factor-part-0-type').click()
    await page.locator('[data-value="Amont"]').click()
    for (const [field, value] of Object.entries(part0Fields)) {
      await page.getByTestId(`emission-factor-part-0-${field}`).locator('input').fill(value)
    }

    const part1Fields: Record<string, string> = {
      co2f: '2', ch4f: '3', ch4b: '4', n2o: '5', co2b: '6', sf6: '7', hfc: '8', pfc: '9', otherGES: '10',
    }
    await page.getByTestId('emission-part-1-expand').click()
    await page.getByTestId('emission-factor-part-1-name').locator('input').fill('My second part')
    await page.getByTestId('emission-factor-part-1-type').click()
    await page.locator('[data-value="Combustion"]').click()
    for (const [field, value] of Object.entries(part1Fields)) {
      await page.getByTestId(`emission-factor-part-1-${field}`).locator('input').fill(value)
    }

    await expect(page.getByTestId('emission-factor-totalCo2').locator('input')).toBeDisabled()
    await expect(page.getByTestId('emission-factor-totalCo2').locator('input')).toHaveValue('81')

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

    await page.getByTestId('emission-factor-search-input').locator('input').fill('My new multiple detailed FE')
    await expect(page.getByTestId('cell-emission-name').first()).toHaveText('My new multiple detailed FE')
    await expect(page.getByTestId('cell-emission-Valeur').first()).toHaveText('81 kgCO₂e/GWh')

    await deleteEmissionFactor(page, 'My new multiple detailed FE')
  })

  test('should render emission parts in accordions and toggle states', async ({ page }) => {
    await login(page, 'bc-collaborator-0@yopmail.com', 'password-0')
    await page.goto('/facteurs-d-emission/creer')

    await expect(page.getByTestId('emission-part-0-header')).toHaveCount(0)
    await expect(page.getByTestId('emission-factor-totalCo2').locator('input')).not.toBeDisabled()

    await page.getByTestId('emission-factor-multiple-switch').click()
    await expect(page.getByTestId('emission-factor-totalCo2').locator('input')).toBeDisabled()
    await expect(page.getByTestId('emission-part-1-header')).toHaveCount(0)

    await page.getByTestId('emission-factor-parts-count').locator('input').fill('3')
    await expect(page.getByTestId('emission-part-0-header')).toHaveText('Composante 1')
    await expect(page.getByTestId('emission-part-1-header')).toHaveText('Composante 2')
    await expect(page.getByTestId('emission-part-2-header')).toHaveText('Composante 3')
    await expect(page.getByTestId('emission-part-3-header')).toHaveCount(0)

    await page.getByTestId('emission-part-0-expand').click()
    await expect(page.getByTestId('emission-factor-part-0-totalCo2')).toBeVisible()
    await expect(page.getByTestId('emission-factor-part-0-totalCo2').locator('input')).not.toBeDisabled()
    await expect(page.getByTestId('emission-factor-part-0-co2f')).toHaveCount(0)

    await page.getByTestId('emission-part-1-expand').click()
    await expect(page.getByTestId('emission-factor-part-1-totalCo2').locator('input')).not.toBeDisabled()
    await expect(page.getByTestId('emission-factor-part-1-co2f')).toHaveCount(0)

    await page.getByTestId('emission-part-2-expand').click()
    await expect(page.getByTestId('emission-factor-part-2-totalCo2').locator('input')).not.toBeDisabled()
    await expect(page.getByTestId('emission-factor-part-2-co2f')).toHaveCount(0)

    // Toggle to detailed — all part totalCo2 become disabled, co2f appears
    await page.getByTestId('emission-factor-detailed-switch').click()
    await expect(page.getByTestId('emission-factor-part-0-totalCo2').locator('input')).toBeDisabled()
    await expect(page.getByTestId('emission-factor-part-0-co2f')).toBeVisible()
    await expect(page.getByTestId('emission-factor-part-1-totalCo2').locator('input')).toBeDisabled()
    await expect(page.getByTestId('emission-factor-part-1-co2f')).toBeVisible()
    await expect(page.getByTestId('emission-factor-part-2-totalCo2').locator('input')).toBeDisabled()
    await expect(page.getByTestId('emission-factor-part-2-co2f')).toBeVisible()

    // Toggle multiple off — parts collapse
    await page.getByTestId('emission-factor-multiple-switch').click()
    await expect(page.getByTestId('emission-part-0-header')).toHaveCount(0)
    await expect(page.getByTestId('emission-part-1-header')).toHaveCount(0)
    await expect(page.getByTestId('emission-part-2-header')).toHaveCount(0)
    await expect(page.getByTestId('emission-factor-totalCo2').locator('input')).toBeDisabled()
  })

  test('should not delete parts from form when toggling multiple switch', async ({ page }) => {
    test.setTimeout(60000)

    await login(page, 'bc-collaborator-0@yopmail.com', 'password-0')
    await page.goto('/facteurs-d-emission/creer')

    await page.getByTestId('emission-factor-name').locator('input').fill('My new FE without parts')
    await page.getByTestId('emission-factor-unit').click()
    await page.locator('[data-value="GWH"]').click()
    await page.getByTestId('emission-factor-source').locator('input').fill('Magic')

    await page.getByTestId('emission-factor-multiple-switch').click()
    await page.getByTestId('emission-factor-parts-count').locator('input').fill('2')

    await page.getByTestId('emission-part-0-expand').click()
    await page.getByTestId('emission-factor-part-0-name').locator('input').fill('My first part')
    await page.getByTestId('emission-factor-part-0-type').click()
    await page.locator('[data-value="Amont"]').click()
    await page.getByTestId('emission-factor-part-0-totalCo2').locator('input').fill('3')

    await page.getByTestId('emission-part-1-expand').click()
    await page.getByTestId('emission-factor-part-1-name').locator('input').fill('My second part')
    await page.getByTestId('emission-factor-part-1-type').click()
    await page.locator('[data-value="Combustion"]').click()
    await page.getByTestId('emission-factor-part-1-totalCo2').locator('input').fill('6')

    await expect(page.getByTestId('emission-factor-totalCo2').locator('input')).toHaveValue('9')

    // Reducing parts count hides last part
    await page.getByTestId('emission-factor-parts-count').locator('input').fill('1')
    await expect(page.getByTestId('emission-part-1-header')).toHaveCount(0)
    await expect(page.getByTestId('emission-factor-totalCo2').locator('input')).toHaveValue('3')

    // Restoring parts count brings back the original part data
    await page.getByTestId('emission-factor-parts-count').locator('input').fill('2')
    await expect(page.getByTestId('emission-part-1-header')).toHaveText('My second part')
    await expect(page.getByTestId('emission-factor-totalCo2').locator('input')).toHaveValue('9')

    // Toggle multiple off then back on — data persists
    await page.getByTestId('emission-factor-multiple-switch').click()
    await expect(page.getByTestId('emission-part-0-header')).toHaveCount(0)
    await page.getByTestId('emission-factor-multiple-switch').click()
    await expect(page.getByTestId('emission-part-0-header')).toHaveText('My first part')
    await expect(page.getByTestId('emission-part-1-header')).toHaveText('My second part')
    await expect(page.getByTestId('emission-factor-parts-count').locator('input')).toHaveValue('2')

    // Delete first part — second part shifts to index 0
    await page.getByTestId('delete-emission-part-0').click()
    await expect(page.getByTestId('emission-factor-parts-count').locator('input')).toHaveValue('1')
    await expect(page.getByTestId('delete-emission-part-0')).toBeDisabled()
    await expect(page.getByTestId('emission-part-0-header')).toHaveText('My second part')

    // Add back a part
    await page.getByTestId('emission-factor-parts-count').locator('input').fill('2')
    await expect(page.getByTestId('delete-emission-part-0')).not.toBeDisabled()
    await expect(page.getByTestId('emission-part-1-header')).toHaveText('My first part')

    // Switch multiple off, set total, and create
    await page.getByTestId('emission-factor-multiple-switch').click()
    await page.getByTestId('emission-factor-totalCo2').locator('input').fill('144')

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

    await page.getByTestId('emission-factor-search-input').locator('input').fill('My new FE without parts')
    await expect(page.getByTestId('cell-emission-name').first()).toHaveText('My new FE without parts')
    await expect(page.getByTestId('cell-emission-Valeur').first()).toHaveText('144 kgCO₂e/GWh')

    await deleteEmissionFactor(page, 'My new FE without parts')
  })
})
