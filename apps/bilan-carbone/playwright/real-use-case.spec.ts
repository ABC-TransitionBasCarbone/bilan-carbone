import { expect, test, type Locator, type Page } from '@playwright/test'
import { login, resetTestDatabase } from './playwright.helpers'

const studyId = '91bb3826-2be7-4d56-bb9b-363f4d9af62f'
const route = `/etudes/${studyId}/comptabilisation/resultats`

type RowAssertions = Record<number, string>

const assertTableRow = async (row: Locator, cells: RowAssertions) => {
  for (const [index, value] of Object.entries(cells)) {
    await expect(row.locator('td').nth(Number(index))).toHaveText(value)
  }
}

const assertResultsTableRows = async (page: Page, testId: string, rows: RowAssertions[]) => {
  const tableRows = page.getByTestId(testId)
  for (let i = 0; i < rows.length; i++) {
    await assertTableRow(tableRows.nth(i), rows[i])
  }
}

test.describe('Real use case: BC V8_10', () => {
  test.beforeAll(() => {
    resetTestDatabase()
  })

  test('should correctly compute results', async ({ page }) => {
    test.setTimeout(120000)

    await login(page, 'bc-collaborator-0@yopmail.com', 'password-0')
    await page.goto(route)

    await test.step('Check summary emissions', async () => {
      await expect(page.getByTestId('withDep-total-result')).toContainText('280') // 280.45
      await expect(page.getByTestId('withoutDep-total-result')).toContainText('280')
      await page.getByTestId('dependency-result-budget').scrollIntoViewIfNeeded()
      await expect(page.getByTestId('dependency-result-budget')).toContainText('0') // 0.28
      await page.getByTestId('responsibility-result-budget').scrollIntoViewIfNeeded()
      await expect(page.getByTestId('responsibility-result-budget')).toContainText('0')
      await page.getByTestId('dependency-result-etp').scrollIntoViewIfNeeded()
      await expect(page.getByTestId('dependency-result-etp')).toContainText('8') // 8.01
      await page.getByTestId('responsibility-result-etp').scrollIntoViewIfNeeded()
      await expect(page.getByTestId('responsibility-result-etp')).toContainText('8')
      await page.getByTestId('results-monetary-ratio').scrollIntoViewIfNeeded()
      await expect(page.getByTestId('results-monetary-ratio')).toContainText('36,99') // 36.99
      await page.getByTestId('results-non-spe-monetary-ratio').scrollIntoViewIfNeeded()
      await expect(page.getByTestId('results-non-spe-monetary-ratio')).toContainText('36,99')
    })

    await test.step('Check consolidated results table', async () => {
      await page.getByTestId('post-table').click()

      await assertResultsTableRows(page, 'consolidated-results-table-row', [
        { 0: 'Autres émissions directes', 2: '17' }, // 16.66
        { 0: 'Déchets directs', 2: '0' }, // 0.18
        { 0: 'Déplacements', 2: '105' }, // 105.37
        { 0: 'Énergie', 2: '16' }, // 15.79
        { 0: 'Fin de vie', 2: '6' }, // 6.28
        { 0: 'Fret', 2: '4' }, // 4.33
        { 0: 'Immobilisations', 2: '12' }, // 11.55
        { 0: 'Intrants biens et matières', 2: '17' }, // 16.54
        { 0: 'Intrants services', 2: '104' }, // 103.74
        { 0: 'Utilisation et dépendance', 2: '0' },
        { 0: 'Total', 2: '280' }, // 280.45
      ])
    })

    await test.step('Check BEGES results table', async () => {
      await page.getByTestId('result-type-select').click()
      await page.locator('[data-value="Beges"]').click()

      await assertResultsTableRows(page, 'beges-results-table-row', [
        { 2: '4', 3: '0', 4: '0', 5: '0', 6: '4', 7: '34' }, // row 0
        { 1: '38', 2: '0', 3: '0', 4: '0', 5: '38', 6: '0' }, // row 1
        { 1: '0', 2: '0', 3: '0', 4: '0', 5: '0', 6: '0' }, // row 2
        { 1: '17', 2: '0', 3: '0', 4: '0', 5: '17', 6: '0' }, // row 3
        { 1: '0', 2: '0', 3: '0', 4: '0', 5: '0', 6: '0' }, // row 4
        { 1: '58', 2: '0', 3: '0', 4: '0', 5: '59', 6: '34' }, // row 5 - 58.52
        { 2: '6', 3: '0', 4: '0', 5: '0', 6: '6', 7: '0' }, // row 6 - 5.61
        { 1: '0', 2: '0', 3: '0', 4: '0', 5: '0', 6: '0' }, // row 7
        { 1: '6', 2: '0', 3: '0', 4: '0', 5: '6', 6: '0' }, // row 8 - 5.61
        { 2: '1', 3: '0', 4: '0', 5: '0', 6: '1', 7: '0' }, // row 9 - 1.49
        { 1: '0', 2: '0', 3: '0', 4: '0', 5: '0', 6: '0' }, // row 10
        { 1: '49', 2: '0', 3: '0', 4: '0', 5: '49', 6: '0' }, // row 11 - 48.65
        { 1: '0', 2: '0', 3: '0', 4: '0', 5: '0', 6: '0' }, // row 12
        { 1: '2', 2: '0', 3: '0', 4: '1', 5: '3', 6: '0' }, // row 13 - 2.01 / 0.53 / 2.55
        { 1: '52', 2: '0', 3: '0', 4: '1', 5: '53', 6: '0' }, // row 14 - 52.15 / 0.53 / 52.69
        { 2: '32', 3: '0', 4: '0', 5: '0', 6: '32', 7: '-34' }, // row 15 - 31.82 / 31.9 / -33.95
        { 1: '22', 2: '0', 3: '0', 4: '0', 5: '22', 6: '0' }, // row 16 - 21.52
        { 1: '2', 2: '0', 3: '0', 4: '0', 5: '2', 6: '0' }, // row 17 - 1.81 / 1.86
        { 1: '0', 2: '0', 3: '0', 4: '0', 5: '0', 6: '0' }, // row 18
        { 1: '104', 2: '0', 3: '0', 4: '0', 5: '104', 6: '0' }, // row 19 - 103.74
        { 1: '159', 2: '0', 3: '0', 4: '0', 5: '159', 6: '-34' }, // row 20 - 158.9 / 159.02 / -33.88
        { 2: '0', 3: '0', 4: '0', 5: '0', 6: '0', 7: '0' }, // row 21
        { 1: '0', 2: '0', 3: '0', 4: '0', 5: '0', 6: '0' }, // row 22
        { 1: '6', 2: '1', 3: '0', 4: '0', 5: '6', 6: '1' }, // row 23 - 5.77 / 0.71 / 6.49 / 0.86
        { 1: '0', 2: '0', 3: '0', 4: '0', 5: '0', 6: '0' }, // row 24
        { 1: '6', 2: '1', 3: '0', 4: '0', 5: '6', 6: '1' }, // row 25 - 5.77 / 0.71 / 6.49 / 0.86
        { 2: '0', 3: '0', 4: '0', 5: '0', 6: '0', 7: '0' }, // row 26
        { 1: '0', 2: '0', 3: '0', 4: '0', 5: '0', 6: '0' }, // row 27
        { 2: '281', 3: '1', 4: '0', 5: '1', 6: '282', 7: '1' }, // row 28 - totals
      ])
    })

    await test.step('Check GHGP results table', async () => {
      await page.getByTestId('result-type-select').click()
      await page.locator('[data-value="GHGP"]').click()

      await assertResultsTableRows(page, 'ghgp-results-table-row', [
        // 1
        { 2: '4', 3: '0', 4: '0', 5: '0', 6: '0', 7: '0', 8: '4', 9: '34' }, // row 0 - 3.99 / 4.015 / 33.9
        { 1: '38', 2: '0', 3: '0', 4: '0', 5: '0', 6: '0', 7: '38', 8: '0' }, // row 1 - 37.8
        { 1: '0', 2: '0', 3: '0', 4: '0', 5: '0', 6: '0', 7: '0', 8: '0' }, // row 2
        { 1: '17', 2: '0', 3: '0', 4: '0', 5: '0', 6: '0', 7: '17', 8: '0' }, // row 3 - 16.6
        { 1: '58', 2: '0', 3: '0', 4: '0', 5: '0', 6: '0', 7: '59', 8: '34' }, // row 4 - 58.52 / 33.9
        // 2
        { 2: '6', 3: '0', 4: '0', 5: '0', 6: '0', 7: '0', 8: '6', 9: '0' }, // row 5 - 5.6
        { 1: '0', 2: '0', 3: '0', 4: '0', 5: '0', 6: '0', 7: '0', 8: '0' }, // row 6
        { 1: '6', 2: '0', 3: '0', 4: '0', 5: '0', 6: '0', 7: '6', 8: '0' }, // row 7 - 5.6
        // 3.amont
        { 2: '120', 3: '0', 4: '0', 5: '0', 6: '0', 7: '0', 8: '120', 9: '0' }, // row 8 - 120.2
        { 1: '0', 2: '0', 3: '0', 4: '0', 5: '0', 6: '0', 7: '0', 8: '0' }, // row 9
        { 1: '15', 2: '0', 3: '0', 4: '0', 5: '0', 6: '0', 7: '15', 8: '-34' }, // row 10 - 15.2 / 15.4 / -33.9
        { 1: '1', 2: '0', 3: '0', 4: '0', 5: '0', 6: '0', 7: '1', 8: '0' }, // row 11 - 1.4
        { 1: '0', 2: '0', 3: '0', 4: '0', 5: '0', 6: '0', 7: '0', 8: '0' }, // row 12
        { 1: '2', 2: '0', 3: '0', 4: '0', 5: '0', 6: '0', 7: '2', 8: '0' }, // row 13 - 2.0
        { 1: '49', 2: '0', 3: '0', 4: '0', 5: '0', 6: '0', 7: '49', 8: '0' }, // row 14 - 48.6
        { 1: '0', 2: '0', 3: '0', 4: '0', 5: '0', 6: '0', 7: '0', 8: '0' }, // row 15
        { 1: '188', 2: '0', 3: '0', 4: '0', 5: '0', 6: '0', 7: '188', 8: '-34' }, // row 16 - -33.9
        // 3.aval
        { 2: '0', 3: '0', 4: '0', 5: '0', 6: '0', 7: '0', 8: '0', 9: '0' }, // row 17
        { 1: '0', 2: '0', 3: '0', 4: '0', 5: '0', 6: '0', 7: '0', 8: '0' }, // row 18
        { 1: '0', 2: '0', 3: '0', 4: '0', 5: '0', 6: '0', 7: '0', 8: '0' }, // row 19
        { 1: '6', 2: '1', 3: '0', 4: '0', 5: '0', 6: '0', 7: '6', 8: '1' }, // row 20 - 6 / 0.7 / 0.8
        { 1: '0', 2: '0', 3: '0', 4: '0', 5: '0', 6: '0', 7: '0', 8: '0' }, // row 21
        { 1: '0', 2: '0', 3: '0', 4: '0', 5: '0', 6: '0', 7: '0', 8: '0' }, // row 22
        { 1: '0', 2: '0', 3: '0', 4: '0', 5: '0', 6: '0', 7: '0', 8: '0' }, // row 23
        // 3.aval total
        { 1: '6', 2: '1', 3: '0', 4: '0', 5: '0', 6: '0', 7: '6', 8: '1' }, // row 24 - 5.6 / 0.7 / 6.3 / 0.9
        // Total
        { 2: '258', 3: '1', 4: '0', 5: '0', 6: '0', 7: '0', 8: '258', 9: '1' }, // row 25 - 0.8 / 0.9
      ])
    })
  })
})
