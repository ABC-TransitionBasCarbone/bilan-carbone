const surveyId = 'campaign-admin-seed-id'

const goToQuestion = (questionSnippet: string, remainingSteps = 250) => {
  if (remainingSteps <= 0) {
    throw new Error(`Could not find question containing: ${questionSnippet}`)
  }

  cy.get('body').then(($body) => {
    const pageText = $body.text()
    if (pageText.includes(questionSnippet)) {
      return
    }

    if ($body.find('[data-testid="survey-start-button"]').length > 0) {
      cy.getByTestId('survey-start-button').click()
      goToQuestion(questionSnippet, remainingSteps - 1)
      return
    }

    if ($body.find('[data-testid="survey-category-interstitial"]').length > 0) {
      cy.getByTestId('survey-interstitial-continue').click()
      goToQuestion(questionSnippet, remainingSteps - 1)
      return
    }

    if ($body.find('[data-testid="survey-next-button"]').length > 0) {
      cy.getByTestId('survey-next-button').click()
      goToQuestion(questionSnippet, remainingSteps - 1)
      return
    }

    throw new Error(`Navigation blocked before reaching question: ${questionSnippet}`)
  })
}

const getFirstVisibleQuestion = (questionSnippets: string[], remainingSteps = 250): Cypress.Chainable<string> => {
  if (remainingSteps <= 0) {
    throw new Error(`Could not find one of the expected questions: ${questionSnippets.join(', ')}`)
  }

  return cy.get('body').then(($body): Cypress.Chainable<string> => {
    const pageText = $body.text()

    for (const questionSnippet of questionSnippets) {
      if (pageText.includes(questionSnippet)) {
        return cy.wrap(questionSnippet)
      }
    }

    if ($body.find('[data-testid="survey-start-button"]').length > 0) {
      cy.getByTestId('survey-start-button').click()
      return getFirstVisibleQuestion(questionSnippets, remainingSteps - 1)
    }

    if ($body.find('[data-testid="survey-category-interstitial"]').length > 0) {
      cy.getByTestId('survey-interstitial-continue').click()
      return getFirstVisibleQuestion(questionSnippets, remainingSteps - 1)
    }

    if ($body.find('[data-testid="survey-next-button"]').length > 0) {
      cy.getByTestId('survey-next-button').click()
      return getFirstVisibleQuestion(questionSnippets, remainingSteps - 1)
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
  })

  it('shows ordered telework suggestions and category-specific suggestion color', () => {
    goToQuestion('Combien de jours de télétravail faites-vous en moyenne par semaine')

    cy.getByTestId('survey-suggestions').should('be.visible')
    cy.get('[data-testid^="survey-suggestion-"]').then(($buttons) => {
      const labels = [...$buttons].map((button) => button.textContent?.trim() ?? '')
      expect(labels).to.deep.equal(['aucun', 'un jour', 'deux jours', 'trois jours', 'quatre jours', 'cinq jours'])
    })

    cy.getByTestId('survey-suggestion-1').invoke('css', 'background-color').as('ttSuggestionColor')

    goToQuestion('Quelle est votre consommation de boissons chaudes par jour')

    cy.getByTestId('survey-suggestions').should('be.visible')
    cy.get('@ttSuggestionColor').then((ttSuggestionColor) => {
      cy.getByTestId('survey-suggestion-1')
        .invoke('css', 'background-color')
        .should('not.equal', String(ttSuggestionColor))
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
    cy.contains('button', 'végétarien').click()

    cy.get('input').then(($inputs) => {
      const values = [...$inputs].map((input) => Number((input as HTMLInputElement).value || 0))
      expect(values).to.include(2)
      expect(values).to.include(3)
    })
  })

  it('shows and applies hot drinks mosaic suggestions', () => {
    goToQuestion('Quelle est votre consommation de boissons chaudes par jour')

    cy.getByTestId('survey-suggestions').should('be.visible')
    cy.contains('button', 'un café matin et midi').click()

    cy.get('input').then(($inputs) => {
      const values = [...$inputs].map((input) => Number((input as HTMLInputElement).value || 0))
      expect(values).to.include(2)
    })
  })
})
