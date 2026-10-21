describe('Survey impactco2 widgets', () => {
  const surveyId = 'campaign-admin-seed-id'

  before(() => {
    cy.resetTestDatabase()
  })

  beforeEach(() => {
    cy.clearLocalStorage(`mip-publicodes-state-${surveyId}`)
    cy.visit(`/${surveyId}/survey`)
  })

  it('displays the categories sidebar on the survey page', () => {
    cy.getByTestId('survey-categories-sidebar').should('be.visible')
  })

  it('displays the impactco2 widget for transport-related questions', () => {
    const findWidgetOrNext = (remainingSteps = 50) => {
      if (remainingSteps <= 0) {
        return
      }

      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="survey-impactco2-widget"]').length > 0) {
          cy.getByTestId('survey-impactco2-widget').should('be.visible')
          return
        }

        if ($body.find('[data-testid="survey-next-button"]').length > 0) {
          cy.getByTestId('survey-next-button').click()
          findWidgetOrNext(remainingSteps - 1)
        }
      })
    }

    findWidgetOrNext()
  })

  it('shows the category interstitial when transitioning between categories', () => {
    const findInterstitialOrNext = (remainingSteps = 200) => {
      if (remainingSteps <= 0) {
        return
      }

      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="survey-category-interstitial"]').length > 0) {
          cy.getByTestId('survey-category-interstitial').should('be.visible')
          cy.getByTestId('survey-categories-sidebar').should('be.visible')
          cy.getByTestId('survey-next-button').should('be.visible')
          cy.getByTestId('survey-previous-button').click()
          cy.getByTestId('survey-next-button').click()
          cy.getByTestId('survey-category-interstitial').should('be.visible')
          return
        }

        if ($body.find('[data-testid="survey-complete-button"]').length > 0) {
          return
        }

        if ($body.find('[data-testid="survey-next-button"]').length > 0) {
          cy.getByTestId('survey-next-button').click()
          findInterstitialOrNext(remainingSteps - 1)
        }
      })
    }

    cy.getByTestId('survey-next-button').click()
    cy.getByTestId('survey-category-interstitial').should('not.exist')
    findInterstitialOrNext()
  })

  it('continues the survey after dismissing the interstitial', () => {
    const clickUntilInterstitial = (remainingSteps = 200) => {
      if (remainingSteps <= 0) {
        return
      }

      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="survey-category-interstitial"]').length > 0) {
          cy.getByTestId('survey-next-button').click()
          cy.getByTestId('survey-categories-sidebar').should('be.visible')
          cy.getByTestId('survey-category-interstitial').should('not.exist')
          cy.getByTestId('survey-previous-button').click()
          cy.getByTestId('survey-category-interstitial').should('be.visible')
          cy.getByTestId('survey-next-button').click()
          cy.getByTestId('survey-category-interstitial').should('not.exist')
          cy.getByTestId('survey-previous-button').click()
          cy.getByTestId('survey-category-interstitial').should('be.visible')
          cy.getByTestId('survey-previous-button').click()
          cy.getByTestId('survey-category-interstitial').should('not.exist')
          cy.getByTestId('survey-next-button').click()
          cy.getByTestId('survey-category-interstitial').should('be.visible')
          return
        }

        if ($body.find('[data-testid="survey-complete-button"]').length > 0) {
          return
        }

        if ($body.find('[data-testid="survey-next-button"]').length > 0) {
          cy.getByTestId('survey-next-button').click()
          clickUntilInterstitial(remainingSteps - 1)
        }
      })
    }

    clickUntilInterstitial()
  })

  it('shows the previous category interstitial when navigating back across categories', () => {
    const clickUntilInterstitial = (remainingSteps = 200): Cypress.Chainable<null> => {
      if (remainingSteps <= 0) {
        throw new Error('Could not reach a category interstitial')
      }

      return cy.get('body').then(($body): Cypress.Chainable<null> => {
        if ($body.find('[data-testid="survey-category-interstitial"]').length > 0) {
          return cy.wrap(null)
        }

        if ($body.find('[data-testid="survey-start-button"]').length > 0) {
          return cy
            .getByTestId('survey-start-button')
            .click()
            .then(() => clickUntilInterstitial(remainingSteps - 1))
        }

        if ($body.find('[data-testid="survey-next-button"]').length > 0) {
          return cy
            .getByTestId('survey-next-button')
            .click()
            .then(() => clickUntilInterstitial(remainingSteps - 1))
        }

        throw new Error('Survey navigation stopped before a category interstitial')
      })
    }

    clickUntilInterstitial()
    cy.getByTestId('survey-next-button').click()
    cy.getByTestId('survey-previous-button').click()
    cy.getByTestId('survey-category-interstitial').should('be.visible')
  })
})
