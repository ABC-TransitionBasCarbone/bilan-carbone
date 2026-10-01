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
    cy.getByTestId('survey-categories-sidebar')
      .find('span')
      .filter((_, element) => element.textContent?.endsWith(' kg') ?? false)
      .each(($value) => {
        cy.wrap($value).should('have.text', '0 kg')
      })
    cy.getByTestId('survey-categories-sidebar').find('progress').first().should('have.attr', 'value', '0')

    cy.getByTestId('survey-next-button').click()
    cy.getByTestId('survey-categories-sidebar').find('progress').first().should('have.attr', 'value', '1')

    completeSurveyFromCurrentPage()

    cy.url().should('include', `/${surveyId}/results`)
    cy.window().then((window) => {
      const state = JSON.parse(window.localStorage.getItem(`mip-publicodes-state-${surveyId}`) ?? '{}')
      expect(state.situation).to.deep.equal({})
    })
    cy.getByTestId('survey-completion-footprint-banner').should('be.visible')

    cy.reload()

    cy.url().should('include', `/${surveyId}/results`)
    cy.getByTestId('survey-completion-footprint-banner').should('be.visible')
    cy.getByTestId('survey-completion-actions').should('be.visible')
  })
})
