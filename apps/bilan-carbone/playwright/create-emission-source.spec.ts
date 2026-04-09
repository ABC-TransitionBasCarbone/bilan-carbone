import { execSync } from 'node:child_process'

import { expect, test, type Locator, type Page } from '@playwright/test'

const studyId = '88c93e88-7c80-4be4-905b-f0bbd2ccc779'
const post = 'IntrantsBiensEtMatieres'
const subPostTestId = 'subpost-MetauxPlastiquesEtVerre'

const sourceNameInitial = 'My new emission source'
const sourceName = 'My emission source name'
const sourceNameCopy = `${sourceName} - copie`
const sourceNameEdited = 'My edited emission source name'

const route = `/etudes/${studyId}/comptabilisation/saisie-des-donnees/${post}`

const login = async (page: Page, email: string, password: string) => {
  await page.goto('/login')
  await page.locator('[data-testid="input-email"] input').fill(email)
  await page.locator('[data-testid="input-password"] input').fill(password)
  await page.getByTestId('login-button').click()
  await expect(page).toHaveURL(/fromLogin/, { timeout: 30000 })
}

const logout = async (page: Page) => {
  await page.goto('/logout')
}

const sourceCard = (page: Page, name: string): Locator => page.getByTestId(`emission-source-${name}`).first()
const inputByTestId = (scope: Page | Locator, testId: string): Locator =>
  scope.getByTestId(testId).locator('input,textarea')

const sourceRowAssertions = async (
  page: Page,
  name: string,
  { status, value, quality }: { status: string; value: string; quality: string },
) => {
  const card = sourceCard(page, name)
  await expect(card.getByTestId('emission-source-status')).toContainText(status)
  await expect(card.getByTestId('emission-source-value')).toHaveText(value)
  await expect(card.getByTestId('emission-source-quality')).toHaveText(quality)
}

const openSubPost = async (page: Page, { canCreate = true } = {}) => {
  const subPost = page.getByTestId(subPostTestId)
  const toggle = subPost.getByTestId('subpost')
  await toggle.scrollIntoViewIfNeeded()
  const isExpanded = await toggle.getAttribute('aria-expanded')
  if (isExpanded !== 'true') {
    await toggle.click()
  }
  if (canCreate) {
    await expect(subPost.getByTestId('new-emission-source')).toBeVisible()
  } else {
    await expect(toggle).toHaveAttribute('aria-expanded', 'true')
  }
}

test.describe('Create study emission source (Playwright migration)', () => {
  test.beforeAll(() => {
    const env = { ...process.env }
    delete env['CLAUDECODE']
    execSync('yarn db:test:reset', { stdio: 'inherit', env })
  })

  test('covers the same functional flow as Cypress', async ({ page }) => {
    test.setTimeout(120000)

    await test.step('Admin creates and validates an emission source', async () => {
      await login(page, 'bc-collaborator-0@yopmail.com', 'password-0')
      await page.goto(route)
      await openSubPost(page)

      const subPost = page.getByTestId(subPostTestId)
      const newSourceInput = inputByTestId(subPost, 'new-emission-source')
      const addSourceButton = subPost.getByTestId('new-emission-source-add')
      await expect(newSourceInput).toBeEditable({ timeout: 3000 })
      await newSourceInput.click()
      await newSourceInput.clear()
      await newSourceInput.pressSequentially(sourceNameInitial)
      await expect(newSourceInput).toHaveValue(sourceNameInitial)
      await newSourceInput.blur()
      await expect(addSourceButton).toBeEnabled({ timeout: 3000 })
      // Wait for the server action to complete before navigating away.
      const createAction = page.waitForResponse(
        (r) => r.url().includes('IntrantsBiensEtMatieres') && r.request().method() === 'POST',
      )
      await addSourceButton.click()
      await createAction

      // Navigate fresh to guarantee the new source appears (router.refresh() can return stale RSC data).
      await page.goto(route)
      await openSubPost(page)
      await expect(sourceCard(page, sourceNameInitial)).toBeVisible({ timeout: 15000 })
      await expect(sourceCard(page, sourceNameInitial).getByTestId('emission-source-status')).toHaveText(
        "En attente d'un·e contributeur·rice",
      )
      await expect(sourceCard(page, sourceNameInitial).getByTestId('emission-source-quality')).toHaveCount(0)

      await sourceCard(page, sourceNameInitial).click()
      await expect(page.getByTestId('emission-source-validate')).toBeDisabled()

      const nameInput = sourceCard(page, sourceNameInitial).getByTestId('emission-source-name').locator('input')
      await nameInput.fill(sourceName)
      await nameInput.blur()
      // Wait for the name save + RSC refresh to complete before interacting with the factor search.
      await expect(sourceCard(page, sourceName)).toBeVisible({ timeout: 10000 })
      const factorSearchInput = inputByTestId(page, 'emission-source-factor-search')
      await factorSearchInput.click()
      await factorSearchInput.clear()
      // MUI autocomplete is more reliable in CI with key-by-key typing.
      await factorSearchInput.pressSequentially('acier ou fer blanc', { delay: 40 })
      await expect(factorSearchInput).toHaveValue('acier ou fer blanc')
      // Wait for suggestions to appear then click the first one.
      const firstSuggestion = page.getByTestId('emission-source-factor-suggestion').first()
      await expect(firstSuggestion).toBeVisible({ timeout: 8000 })
      await firstSuggestion.click()
      await expect(page.getByTestId('emission-source-factor')).toBeVisible({ timeout: 8000 })

      await page.getByTestId('emission-source-value-da').locator('input').fill('456')
      await expect(sourceCard(page, sourceNameInitial)).toHaveCount(0)
      await expect(sourceCard(page, sourceName)).toBeVisible()

      await page.getByTestId('emission-source-source').locator('input').fill('My source')
      await page.getByTestId('emission-source-type').click()
      await page.locator('[data-value="Physical"]').click()
      await sourceRowAssertions(page, sourceName, {
        status: 'À vérifier',
        value: '1 008 tCO₂e',
        quality: 'Qualité : Très mauvaise',
      })

      // Expand quality fields if collapsed.
      const expandButton = page.getByTestId('emission-source-quality-expand-button')
      if (await expandButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        await expandButton.click()
      }
      await page.getByTestId('emission-source-reliability').click()
      await page.locator('[data-value="4"]').click()

      await page.getByTestId('emission-source-tag').click()
      await page.getByTestId('tag-option').first().click()
      await expect(page.getByTestId('emission-source-tag')).toContainText('Numérique')

      await sourceRowAssertions(page, sourceName, {
        status: 'À vérifier',
        value: '1 008 tCO₂e',
        quality: 'Qualité : Mauvaise',
      })
      await expect(page.getByTestId('emission-source-quality-expand-button')).toHaveCount(0)
      await expect(page.getByTestId('emission-source-result')).toHaveText(
        'Intervalle de confiance à 95% :[437; 2 328] (en tCO₂e)Alpha :130,87%',
      )

      await page.getByTestId('emission-source-technicalRepresentativeness').click()
      await page.locator('[data-value="1"]').click()
      await page.getByTestId('emission-source-geographicRepresentativeness').click()
      await page.locator('[data-value="4"]').click()
      await page.getByTestId('emission-source-temporalRepresentativeness').click()
      await page.locator('[data-value="4"]').click()
      await page.getByTestId('emission-source-completeness').click()
      await page.locator('[data-value="5"]').click()
      await inputByTestId(page, 'emission-source-comment').first().fill('My comment')

      await page.getByTestId('emission-source-validate').click()
      const validatedCard = sourceCard(page, sourceName)
      await expect(validatedCard.getByTestId('emission-source-status')).toHaveText('Validée', { timeout: 10000 })
      await expect(validatedCard.getByTestId('validated-emission-source-name')).toHaveText(sourceName)

      await page.getByTestId('duplicate-emission-source').click()
      await page.getByTestId('duplicate-confirm').click()
      await sourceRowAssertions(page, sourceNameCopy, {
        status: 'À vérifier',
        value: '1 008 tCO₂e',
        quality: 'Qualité : Mauvaise',
      })
    })

    await test.step('Editor can edit but cannot validate', async () => {
      await logout(page)
      await login(page, 'bc-gestionnaire-0@yopmail.com', 'password-0')
      await page.goto(route)
      await openSubPost(page)

      await sourceRowAssertions(page, sourceNameCopy, {
        status: 'À vérifier',
        value: '1 008 tCO₂e',
        quality: 'Qualité : Mauvaise',
      })

      await sourceCard(page, sourceNameCopy).click()
      await sourceCard(page, sourceNameCopy).getByTestId('emission-source-name').locator('input').fill(sourceNameEdited)
      await sourceCard(page, sourceNameCopy).getByTestId('emission-source-name').locator('input').blur()
      // Wait for saving to complete by waiting for the source card to be renamed.
      await expect(sourceCard(page, sourceNameEdited)).toBeVisible({ timeout: 8000 })
      await expect(page.getByTestId('emission-source-validate')).toHaveCount(0)
    })

    await test.step('Reader is read-only', async () => {
      await logout(page)
      await login(page, 'bc-collaborator-1@yopmail.com', 'password-1')
      await page.goto(route)
      await openSubPost(page, { canCreate: false })

      await expect(page.getByTestId('new-emission-source')).toHaveCount(0)
      await sourceRowAssertions(page, sourceNameEdited, {
        status: 'À vérifier',
        value: '1 008 tCO₂e',
        quality: 'Qualité : Mauvaise',
      })

      await sourceCard(page, sourceNameEdited).click()
      await expect(
        sourceCard(page, sourceNameEdited).locator('[data-testid="emission-source-name"] input'),
      ).toBeDisabled()
      await expect(page.getByTestId('emission-source-validate')).toHaveCount(0)
    })

    await test.step('Contributor can only update contribution fields', async () => {
      await logout(page)
      await login(page, 'bc-contributor@yopmail.com', 'password')
      await page.goto(route)
      await expect(page).toHaveURL(`/etudes/${studyId}/contributeur`)
      await openSubPost(page, { canCreate: false })

      await sourceRowAssertions(page, sourceNameEdited, {
        status: 'À vérifier',
        value: '1 008 tCO₂e',
        quality: 'Qualité : Mauvaise',
      })
      await expect(sourceCard(page, sourceNameEdited).getByTestId('emission-source-last-editor')).toHaveCount(0)

      await sourceCard(page, sourceNameEdited).click()
      await expect(sourceCard(page, sourceNameEdited).getByTestId('emission-source-name')).toHaveCount(0)
      await expect(sourceCard(page, sourceNameEdited).getByTestId('validated-emission-source-name')).toHaveText(
        sourceNameEdited,
      )
      await expect(page.getByTestId('emission-source-validate')).toHaveCount(0)

      const valueDaInput = page.getByTestId('emission-source-value-da').locator('input')
      await expect(valueDaInput).toHaveValue('456')
      await valueDaInput.fill('789')
      await valueDaInput.blur()

      await expect(page.getByTestId('emission-source-last-editor')).toContainText('Dernière modification', {
        timeout: 8000,
      })

      await sourceRowAssertions(page, sourceNameEdited, {
        status: 'À vérifier',
        value: '1 744 tCO₂e',
        quality: 'Qualité : Mauvaise',
      })
    })
  })
})
