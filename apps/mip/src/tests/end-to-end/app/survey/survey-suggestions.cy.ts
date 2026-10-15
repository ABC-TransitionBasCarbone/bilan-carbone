const surveyId = 'campaign-admin-seed-id'

const waitForSurveyNavigation = (previousText: string) =>
  cy.get('body').should(($body) => {
    const nextText = $body.find('[data-testid="survey-question-list"]').text()
    const isInterstitial = $body.find('[data-testid="survey-category-interstitial"]').length > 0
    expect(nextText !== previousText || isInterstitial).to.equal(true)
  })

const goToQuestion = (questionSnippet: string, remainingSteps = 250): Cypress.Chainable<null> => {
  if (remainingSteps <= 0) {
    throw new Error(`Could not find question containing: ${questionSnippet}`)
  }

  return cy.get('body').then(($body): Cypress.Chainable<null> => {
    const pageText = $body.find('[data-testid="survey-question-list"]').text()
    if (pageText.includes(questionSnippet)) {
      return cy.wrap(null)
    }

    if ($body.find('[data-testid="survey-start-button"]').length > 0) {
      return cy
        .getByTestId('survey-start-button')
        .click()
        .then(() => waitForSurveyNavigation(pageText))
        .then(() => goToQuestion(questionSnippet, remainingSteps - 1))
    }

    if ($body.find('[data-testid="survey-category-interstitial"]').length > 0) {
      return cy
        .getByTestId('survey-next-button')
        .click()
        .then(() => waitForSurveyNavigation(pageText))
        .then(() => goToQuestion(questionSnippet, remainingSteps - 1))
    }

    if ($body.find('[data-testid="survey-next-button"]').length > 0) {
      return cy
        .getByTestId('survey-next-button')
        .click()
        .then(() => waitForSurveyNavigation(pageText))
        .then(() => goToQuestion(questionSnippet, remainingSteps - 1))
    }

    throw new Error(`Navigation blocked before reaching question: ${questionSnippet}`)
  })
}

const getFirstVisibleQuestion = (questionSnippets: string[], remainingSteps = 250): Cypress.Chainable<string> => {
  if (remainingSteps <= 0) {
    throw new Error(`Could not find one of the expected questions: ${questionSnippets.join(', ')}`)
  }

  return cy.get('body').then(($body): Cypress.Chainable<string> => {
    const pageText = $body.find('[data-testid="survey-question-list"]').text()

    for (const questionSnippet of questionSnippets) {
      if (pageText.includes(questionSnippet)) {
        return cy.wrap(questionSnippet)
      }
    }

    if ($body.find('[data-testid="survey-start-button"]').length > 0) {
      return cy
        .getByTestId('survey-start-button')
        .click()
        .then(() => waitForSurveyNavigation(pageText))
        .then(() => getFirstVisibleQuestion(questionSnippets, remainingSteps - 1))
    }

    if ($body.find('[data-testid="survey-category-interstitial"]').length > 0) {
      return cy
        .getByTestId('survey-next-button')
        .click()
        .then(() => waitForSurveyNavigation(pageText))
        .then(() => getFirstVisibleQuestion(questionSnippets, remainingSteps - 1))
    }

    if ($body.find('[data-testid="survey-next-button"]').length > 0) {
      return cy
        .getByTestId('survey-next-button')
        .click()
        .then(() => waitForSurveyNavigation(pageText))
        .then(() => getFirstVisibleQuestion(questionSnippets, remainingSteps - 1))
    }

    throw new Error(`Navigation blocked before reaching one of: ${questionSnippets.join(', ')}`)
  })
}

describe('Survey suggestions behavior', () => {
  before(() => {
    cy.resetTestDatabase()
  })

  beforeEach(() => {
    cy.clearLocalStorage(`mip-publicodes-state-${surveyId}`)
    cy.visit(`/${surveyId}/survey`)
    cy.getByTestId('survey-start-button').should('be.visible')
  })

  it('shows ordered telework suggestions and category-specific suggestion color', () => {
    goToQuestion('Combien de jours de télétravail faites-vous en moyenne par semaine')

    cy.getByTestId('survey-suggestions').should('be.visible')
    cy.get('[data-testid^="survey-suggestion-"]').then(($buttons) => {
      const labels = [...$buttons].map((button) => button.textContent?.trim() ?? '')
      expect(labels).to.deep.equal(['aucun', 'un jour', 'deux jours', 'trois jours', 'quatre jours', 'cinq jours'])
    })

    cy.getByTestId('survey-suggestion-1').then(($chip) => {
      const suggestionColor = window.getComputedStyle($chip[0]).getPropertyValue('--suggestion-bg')
      cy.wrap(suggestionColor).as('ttSuggestionColor')
    })

    goToQuestion('Quelle est votre consommation de boissons chaudes par jour')

    cy.getByTestId('survey-suggestions').should('be.visible')
    cy.get('@ttSuggestionColor').then((ttSuggestionColor) => {
      cy.getByTestId('survey-suggestion-1').then(($chip) => {
        const suggestionColor = window.getComputedStyle($chip[0]).getPropertyValue('--suggestion-bg')
        expect(suggestionColor).not.to.equal(String(ttSuggestionColor))
      })
    })
  })

  it('shows meal mosaic question before hot drinks question in alimentation', () => {
    const mealQuestion = 'Comment se composent vos repas du midi sur une semaine type de travail'
    const hotDrinksQuestion = 'Quelle est votre consommation de boissons chaudes par jour'

    getFirstVisibleQuestion([mealQuestion, hotDrinksQuestion]).then((firstVisibleQuestion: string) => {
      expect(firstVisibleQuestion).to.equal(mealQuestion)
    })
  })

  it('shows and applies meal mosaic suggestions', () => {
    goToQuestion('Comment se composent vos repas du midi sur une semaine type de travail')

    cy.getByTestId('survey-suggestions').should('be.visible')
    cy.contains('[data-testid^="survey-suggestion-"]', 'végétarien').click()

    cy.get('input').then(($inputs) => {
      const values = [...$inputs].map((input) => Number((input as HTMLInputElement).value || 0))
      expect(values).to.include(2)
      expect(values).to.include(3)
    })
  })

  it('shows and applies hot drinks mosaic suggestions', () => {
    goToQuestion('Quelle est votre consommation de boissons chaudes par jour')

    cy.getByTestId('survey-suggestions').should('be.visible')
    cy.contains('[data-testid^="survey-suggestion-"]', 'un café matin et midi').click()

    cy.get('input').then(($inputs) => {
      const values = [...$inputs].map((input) => Number((input as HTMLInputElement).value || 0))
      expect(values).to.include(2)
    })
  })
})
