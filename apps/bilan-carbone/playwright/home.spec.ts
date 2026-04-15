import { expect, test } from '@playwright/test'
import { login } from './playwright.helpers'

test.describe('Home page', () => {
  test('should display actualities and studies for a simple BC user', async ({ page }) => {
    await login(page, 'bc-collaborator-0@yopmail.com', 'password-0')

    await page.getByTestId('home-actualities').scrollIntoViewIfNeeded()
    await expect(page.getByTestId('home-actualities')).toBeVisible()
    await expect(page.getByTestId('home-actualities')).toContainText('Les actualités du BC+')
    await expect(page.getByTestId('actuality').first()).toBeVisible()

    await page.getByTestId('home-studies').first().scrollIntoViewIfNeeded()
    await expect(page.getByTestId('home-studies')).toBeVisible()
    await expect(page.getByTestId('home-studies')).toContainText('Mes Bilans Carbone®')
  })

  test('should display actualities (count=3) for a CR user', async ({ page }) => {
    await login(page, 'bc-cr-collaborator-1@yopmail.com', 'password-1')

    await page.getByTestId('home-actualities').scrollIntoViewIfNeeded()
    await expect(page.getByTestId('home-actualities')).toBeVisible()
    await expect(page.getByTestId('home-actualities')).toContainText('Les actualités du BC+')
    await expect(page.getByTestId('actuality')).toHaveCount(3)
  })

  test('should display organizations for a CR user', async ({ page }) => {
    await login(page, 'bc-cr-collaborator-1@yopmail.com', 'password-1')

    await page.getByTestId('home-organizations').scrollIntoViewIfNeeded()
    await expect(page.getByTestId('home-organizations')).toBeVisible()
    await expect(page.getByTestId('home-organizations')).toContainText('Mes clients actuels')
  })

  test('should display main title for CUT environment', async ({ page }) => {
    await login(page, 'cut-env-admin-0@yopmail.com', 'password-0')

    await expect(page.getByTestId('title').first()).toContainText("Calculer votre empreinte carbone simplifiée vous permettra de :")
  })
})
