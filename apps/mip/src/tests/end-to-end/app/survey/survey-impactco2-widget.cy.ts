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
          cy.getByTestId('survey-interstitial-continue').should('be.visible')
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

    findInterstitialOrNext()
  })

  it('continues the survey after dismissing the interstitial', () => {
    const clickUntilInterstitial = (remainingSteps = 200) => {
      if (remainingSteps <= 0) {
        return
      }

      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="survey-category-interstitial"]').length > 0) {
          cy.getByTestId('survey-interstitial-continue').click()
          cy.getByTestId('survey-categories-sidebar').should('be.visible')
          cy.getByTestId('survey-category-interstitial').should('not.exist')
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
})
