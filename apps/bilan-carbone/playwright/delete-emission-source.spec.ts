import { expect, test } from '@playwright/test'
import { inputByTestId, login, openSubPost, sourceCard } from './playwright.helpers'

const studyId = '88c93e88-7c80-4be4-905b-f0bbd2ccc779'
const post = 'IntrantsBiensEtMatieres'
const subPostTestId = 'subpost-MetauxPlastiquesEtVerre'
const sourceName = 'My temp emission source'

const route = `/etudes/${studyId}/comptabilisation/saisie-des-donnees/${post}`

test.describe('Delete emission source', () => {
  test('should be able to delete an emission source on a study', async ({ page }) => {
    test.setTimeout(120000)

    await login(page, 'bc-collaborator-0@yopmail.com', 'password-0')

    await page.goto(route)
    await openSubPost(page, subPostTestId)

    const subPost = page.getByTestId(subPostTestId)
    const newSourceInput = inputByTestId(subPost, 'new-emission-source')
    const addSourceButton = subPost.getByTestId('new-emission-source-add')

    await expect(newSourceInput).toBeEditable({ timeout: 3000 })
    await newSourceInput.click()
    await newSourceInput.clear()
    await newSourceInput.pressSequentially(sourceName)
    await expect(newSourceInput).toHaveValue(sourceName)
    await newSourceInput.blur()
    await expect(addSourceButton).toBeEnabled({ timeout: 3000 })
    const createAction = page.waitForResponse(
      (r) => r.url().includes('IntrantsBiensEtMatieres') && r.request().method() === 'POST',
    )
    await addSourceButton.click()
    await createAction

    // Force a fresh navigation to avoid stale RSC cache after server action.
    await page.goto(route)
    await openSubPost(page, subPostTestId)

    const card = sourceCard(page, sourceName)
    await expect(card).toBeVisible({ timeout: 15000 })
    await expect(card.getByTestId('emission-source-status')).toHaveCount(1)

    await card.click()
    await page.getByTestId('emission-source-delete').click()
    await page.getByTestId('delete-emission-source-modal-accept').click()

    await expect(sourceCard(page, sourceName)).toHaveCount(0, { timeout: 10000 })
  })
})
