describe('Survey completion', () => {
  const surveyId = 'campaign-admin-seed-id'

  before(() => {
    cy.resetTestDatabase()
  })

  const completeSurveyFromCurrentPage = (remainingSteps = 200): Cypress.Chainable<null> => {
    if (remainingSteps <= 0) {
      throw new Error('Survey completion exceeded maximum number of navigation steps')
    }

    return cy.get('body').then(($body): Cypress.Chainable<null> => {
      const hasCompleteButton = $body.find('[data-testid="survey-complete-button"]').length > 0
      const isOnInterstitial = $body.find('[data-testid="survey-category-interstitial"]').length > 0

      if (hasCompleteButton && isOnInterstitial) {
        return cy
          .getByTestId('survey-complete-button')
          .click()
          .then(() => cy.url().should('include', `/${surveyId}/results`))
          .then(() => cy.wrap(null))
      }

      if (hasCompleteButton) {
        return cy
          .getByTestId('survey-complete-button')
          .click()
          .then(() => cy.getByTestId('survey-category-interstitial').should('be.visible'))
          .then(() => completeSurveyFromCurrentPage(remainingSteps - 1))
      }

      if ($body.find('[data-testid="survey-start-button"]').length > 0) {
        return cy
          .getByTestId('survey-start-button')
          .click()
          .then(() => completeSurveyFromCurrentPage(remainingSteps - 1))
      }

      if ($body.find('[data-testid="survey-next-button"]').length > 0) {
        return cy
          .getByTestId('survey-next-button')
          .click()
          .then(() => completeSurveyFromCurrentPage(remainingSteps - 1))
      }

      throw new Error('Survey completion stopped before the completion button')
    })
  }

  it('renders completion page and keeps it after refresh', () => {
    cy.visit(`/${surveyId}/results`)

    cy.getByTestId('survey-completion-footprint-banner').should('be.visible')
    cy.getByTestId('survey-completion-actions').should('be.visible')

    cy.reload()

    cy.url().should('include', `/${surveyId}/results`)
    cy.getByTestId('survey-completion-footprint-banner').should('be.visible')
  })

  it('respondent can complete survey and keep completion page after refresh', () => {
    cy.clearLocalStorage(`mip-publicodes-state-${surveyId}`)

    cy.visit(`/${surveyId}/survey`)
    cy.getByTestId('survey-start-button').click()
    cy.getByTestId('survey-categories-sidebar')
      .find('progress')
      .should('have.length', 5)
      .each(($progress) => {
        cy.wrap($progress).should('have.attr', 'value', '0')
      })

    cy.getByTestId('survey-next-button').click()
    cy.getByTestId('survey-categories-sidebar').find('progress').first().should('have.attr', 'value', '0')

    completeSurveyFromCurrentPage()

    cy.url().should('include', `/${surveyId}/results`)
    cy.window().then((window) => {
      const state = JSON.parse(window.localStorage.getItem(`mip-publicodes-state-${surveyId}`) ?? '{}') as {
        situation?: unknown
      }
      expect(state.situation).to.deep.equal({})
    })
    cy.getByTestId('survey-completion-footprint-banner').should('be.visible')

    cy.reload()

    cy.url().should('include', `/${surveyId}/results`)
    cy.getByTestId('survey-completion-footprint-banner').should('be.visible')
    cy.getByTestId('survey-completion-actions').should('be.visible')
  })
})
