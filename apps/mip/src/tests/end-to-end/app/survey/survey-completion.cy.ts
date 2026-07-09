describe('Survey completion', () => {
  const surveyId = 'campaign-admin-seed-id'

  before(() => {
    cy.resetTestDatabase()
  })

  const completeSurveyFromCurrentPage = (remainingSteps = 200) => {
    if (remainingSteps <= 0) {
      throw new Error('Survey completion exceeded maximum number of navigation steps')
    }

    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="survey-complete-button"]').length > 0) {
        cy.getByTestId('survey-complete-button').click()
        return
      }

      cy.getByTestId('survey-next-button').click()
      completeSurveyFromCurrentPage(remainingSteps - 1)
    })
  }

  it('renders completion page and keeps it after refresh', () => {
    cy.visit(`/end/${surveyId}`)

    cy.getByTestId('survey-completion-footprint-banner').should('be.visible')
    cy.getByTestId('survey-completion-actions').should('be.visible')

    cy.reload()

    cy.url().should('include', `/end/${surveyId}`)
    cy.getByTestId('survey-completion-footprint-banner').should('be.visible')
  })

  it('respondent can complete survey and keep completion page after refresh', () => {
    cy.clearLocalStorage(`mip-publicodes-state-${surveyId}`)

    cy.visit(`/survey/${surveyId}`)

    completeSurveyFromCurrentPage()

    cy.url().should('include', `/end/${surveyId}`)
    cy.getByTestId('survey-completion-footprint-banner').should('be.visible')

    cy.reload()

    cy.url().should('include', `/end/${surveyId}`)
    cy.getByTestId('survey-completion-footprint-banner').should('be.visible')
    cy.getByTestId('survey-completion-actions').should('be.visible')
  })
})
