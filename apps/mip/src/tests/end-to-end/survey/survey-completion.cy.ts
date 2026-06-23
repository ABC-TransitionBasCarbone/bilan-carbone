const SURVEY_ID = 'test-survey-cypress'
const STORAGE_KEY = `mip-publicodes-state-${SURVEY_ID}`
const SURVEY_URL = `/survey/${SURVEY_ID}`

describe('Survey completion page', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
  })

  it('shows the completion page after finishing the survey', () => {
    cy.visit(SURVEY_URL)

    // Navigate through all survey pages until complete
    cy.get('body').then(() => {
      const clickNextUntilDone = (maxClicks: number) => {
        if (maxClicks <= 0) return

        // Click "Terminer" if available (last page complete button)
        cy.get('body').then(($body) => {
          const terminerBtn = $body.find('button:contains("Terminer")')
          const continuerBtn = $body.find('button:contains("Continuer")')

          if (terminerBtn.length > 0) {
            cy.wrap(terminerBtn.first()).click()
          } else if (continuerBtn.length > 0) {
            cy.wrap(continuerBtn.first()).click()
            clickNextUntilDone(maxClicks - 1)
          }
        })
      }

      clickNextUntilDone(50)
    })

    cy.get('[data-testid="survey-completion-hero"]', { timeout: 10000 }).should('be.visible')
  })

  it('shows the personal footprint in kg CO₂e', () => {
    cy.visit(SURVEY_URL)

    // Navigate through the survey pages
    for (let i = 0; i < 50; i++) {
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="survey-completion-hero"]').length === 0) {
          const terminerBtn = $body.find('button:contains("Terminer")')
          const continuerBtn = $body.find('button:contains("Continuer")')

          if (terminerBtn.length > 0) {
            cy.wrap(terminerBtn.first()).click()
          } else if (continuerBtn.length > 0) {
            cy.wrap(continuerBtn.first()).click()
          }
        }
      })
    }

    cy.get('[data-testid="survey-completion-hero"]', { timeout: 10000 }).should('be.visible')
    cy.get('[data-testid="survey-completion-hero"]').should('contain', 'kg de CO₂e')
  })

  it('shows the top categories section', () => {
    cy.visit(SURVEY_URL)

    for (let i = 0; i < 50; i++) {
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="survey-completion-hero"]').length === 0) {
          const terminerBtn = $body.find('button:contains("Terminer")')
          const continuerBtn = $body.find('button:contains("Continuer")')
          if (terminerBtn.length > 0) {
            cy.wrap(terminerBtn.first()).click()
          } else if (continuerBtn.length > 0) {
            cy.wrap(continuerBtn.first()).click()
          }
        }
      })
    }

    cy.get('[data-testid="survey-completion-top-categories"]', { timeout: 10000 }).should('be.visible')
    cy.get('[data-testid="survey-completion-top-categories"]').should(
      'contain',
      'Mes principaux postes d\'émissions',
    )
  })

  it('shows the footprint summary section', () => {
    cy.visit(SURVEY_URL)

    for (let i = 0; i < 50; i++) {
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="survey-completion-hero"]').length === 0) {
          const terminerBtn = $body.find('button:contains("Terminer")')
          const continuerBtn = $body.find('button:contains("Continuer")')
          if (terminerBtn.length > 0) {
            cy.wrap(terminerBtn.first()).click()
          } else if (continuerBtn.length > 0) {
            cy.wrap(continuerBtn.first()).click()
          }
        }
      })
    }

    cy.get('[data-testid="survey-completion-summary"]', { timeout: 10000 }).should('be.visible')
    cy.get('[data-testid="survey-completion-summary"]').should('contain', 'Le détail de mon empreinte')
  })

  it('shows FAQ accordions and allows expanding them', () => {
    cy.visit(SURVEY_URL)

    for (let i = 0; i < 50; i++) {
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="survey-completion-hero"]').length === 0) {
          const terminerBtn = $body.find('button:contains("Terminer")')
          const continuerBtn = $body.find('button:contains("Continuer")')
          if (terminerBtn.length > 0) {
            cy.wrap(terminerBtn.first()).click()
          } else if (continuerBtn.length > 0) {
            cy.wrap(continuerBtn.first()).click()
          }
        }
      })
    }

    cy.get('[data-testid="survey-completion-faq"]', { timeout: 10000 }).should('be.visible')
    cy.get('[data-testid="survey-completion-faq"]').should(
      'contain',
      'Est-ce que je peux y arriver tout seul ?',
    )
    cy.get('[data-testid="survey-completion-faq"]').should('contain', 'Par où commencer ?')

    cy.get('[data-testid="survey-completion-faq"]').contains('Est-ce que je peux y arriver tout seul ?').click()
    cy.get('[data-testid="survey-completion-faq"]').should('contain', 'transition écologique est un effort collectif')
  })

  it('allows restarting the survey from the completion page', () => {
    cy.visit(SURVEY_URL)

    for (let i = 0; i < 50; i++) {
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="survey-completion-hero"]').length === 0) {
          const terminerBtn = $body.find('button:contains("Terminer")')
          const continuerBtn = $body.find('button:contains("Continuer")')
          if (terminerBtn.length > 0) {
            cy.wrap(terminerBtn.first()).click()
          } else if (continuerBtn.length > 0) {
            cy.wrap(continuerBtn.first()).click()
          }
        }
      })
    }

    cy.get('[data-testid="survey-completion-hero"]', { timeout: 10000 }).should('be.visible')
    cy.contains('button', 'Recommencer le sondage').click()
    cy.get('[data-testid="survey-completion-hero"]').should('not.exist')
  })
})
