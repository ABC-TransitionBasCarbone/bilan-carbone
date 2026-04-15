import { expect, test } from '@playwright/test'
import { login } from './playwright.helpers'

const studyId = '88c93e88-7c80-4be4-905b-f0bbd2ccc779'

/**
 * bc-contributor@yopmail.com is seeded as a study-level contributor
 * (SubPost.MetauxPlastiquesEtVerre) on study 88c93e88-7c80-4be4-905b-f0bbd2ccc779.
 * They are a COLLABORATOR in organizationVersions[0], so they do have org access
 * but are redirected to /contributeur when accessing study management routes
 * for studies where they only have contributor rights.
 *
 * Note: the full Cypress email-flow tests (creating a new user via invitation link,
 * verifying they have no org access at all) are not ported here because they require
 * a live maildev server. The access-control assertions for the contributeur role
 * within a study are already covered by create-emission-source.spec.ts.
 */
test.describe('Study contributor access control', () => {
  test('contributor is redirected to /contributeur for restricted study routes', async ({ page }) => {
    await login(page, 'bc-contributor@yopmail.com', 'password')

    await page.goto(`/etudes/${studyId}/`)
    await expect(page).toHaveURL(new RegExp(`/etudes/${studyId}/contributeur`), { timeout: 15000 })

    await page.goto(`/etudes/${studyId}/cadrage`)
    await expect(page).toHaveURL(new RegExp(`/etudes/${studyId}/contributeur`))

    await page.goto(`/etudes/${studyId}/perimetre`)
    await expect(page).toHaveURL(new RegExp(`/etudes/${studyId}/contributeur`))

    await page.goto(`/etudes/${studyId}/comptabilisation/saisie-des-donnees`)
    await expect(page).toHaveURL(new RegExp(`/etudes/${studyId}/contributeur`))

    await page.goto(`/etudes/${studyId}/comptabilisation/resultats`)
    await expect(page).toHaveURL(new RegExp(`/etudes/${studyId}/contributeur`))
  })
})
