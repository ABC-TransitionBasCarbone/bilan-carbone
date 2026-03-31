describe('Create study emission source', () => {
  const studyId = '88c93e88-7c80-4be4-905b-f0bbd2ccc779'

  before(() => {
    cy.resetTestDatabase()
  })

  beforeEach(() => {
    cy.intercept('POST', '**/IntrantsBiensEtMatieres').as('serverAction')
    cy.intercept('GET', '**/IntrantsBiensEtMatieres').as('pageLoad')
    cy.intercept('POST', '**/emissionSource*').as('updateEmissionSource')
    cy.intercept('GET', '**/emissionSource*').as('getEmissionSource')
    cy.intercept('GET', '**/tagFamilies*').as('getTagFamilies')
  })

  it('should create an emission source on a study', () => {
    cy.login()

    cy.url().should('eq', `${Cypress.config().baseUrl}/?fromLogin`)
    cy.visit(`/etudes/${studyId}/comptabilisation/saisie-des-donnees/IntrantsBiensEtMatieres`)
    cy.wait('@pageLoad')

    cy.getByTestId('subpost').first().should('be.visible').scrollIntoView()

    cy.getByTestId('subpost').first().click({ force: true })

    cy.getByTestId('new-emission-source').first().should('be.visible').scrollIntoView()

    cy.getByTestId('new-emission-source').first().type('My new emission source{enter}', { delay: 0 })
    cy.wait('@serverAction')
    cy.getByTestId('emission-source-My new emission source').should('be.visible')
    cy.getByTestId('emission-source-My new emission source')
      .first()
      .within(() => {
        cy.getByTestId('emission-source-status')
          .should('be.visible')
          .should('have.text', "En attente d'un·e contributeur·rice")
        cy.getByTestId('emission-source-quality').should('not.exist')
      })

    cy.getByTestId('emission-source-My new emission source').first().click()

    cy.getByTestId('emission-source-validate').should('be.visible').should('be.disabled')

    cy.getByTestId('emission-source-My new emission source')
      .first()
      .within(() => {
        cy.get('[data-testid="emission-source-name"] > .MuiInputBase-root > .MuiInputBase-input')
          .should('be.visible')
          .should('have.value', 'My new emission source')
        cy.getByTestId('emission-source-name').clear()
        cy.getByTestId('emission-source-name').type('My emission source name', { delay: 0 })
      })

    cy.getByTestId('emission-source-factor').should('not.exist')
    cy.getByTestId('emission-source-factor-search')
      .should('be.visible')
      .scrollIntoView()
      .type('acier ou fer blanc', { delay: 0 })
    cy.getByTestId('emission-source-factor-suggestion').should('be.visible')
    cy.getByTestId('emission-source-factor-suggestion').first().click()
    cy.getByTestId('emission-source-factor').should('be.visible')

    cy.getByTestId('emission-source-value-da').should('be.visible').type('456', { delay: 0 })

    cy.getByTestId('emission-source-My new emission source').should('not.exist')
    cy.getByTestId('emission-source-My emission source name').should('be.visible')

    cy.getByTestId('emission-source-My emission source name')
      .first()
      .within(() => {
        cy.get('[data-testid="emission-source-status"] > div')
          .should('be.visible')
          .invoke('text')
          .should('contain', "En attente d'un·e contributeur·rice")
      })

    cy.getByTestId('emission-source-source').should('be.visible').type('My source', { delay: 0 })
    cy.getByTestId('emission-source-type').should('be.visible').click()
    cy.get('[data-value="Physical"]').click()

    cy.getByTestId('emission-source-My emission source name')
      .first()
      .within(() => {
        cy.get('[data-testid="emission-source-status"] > div')
          .should('be.visible')
          .invoke('text')
          .should('contain', 'À vérifier')
        cy.getByTestId('emission-source-value').should('be.visible').should('have.text', '1 008 tCO₂e')
        cy.getByTestId('emission-source-quality').should('be.visible').should('have.text', 'Qualité : Très mauvaise')
      })

    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="emission-source-quality-select"]').length) {
        cy.getByTestId('emission-source-quality-expand-button').click()
      }
    })
    cy.getByTestId('emission-source-reliability').should('be.visible').click()
    cy.get('[data-value="4"]').click()
    cy.getByTestId('emission-source-status').should('be.visible').invoke('text').should('contain', 'Enregistré')

    cy.getByTestId('emission-source-tag').should('be.visible').click()
    cy.getByTestId('tag-option').first().click()
    cy.getByTestId('emission-source-tag').should('contain', 'Numérique')

    cy.getByTestId('emission-source-My emission source name')
      .first()
      .within(() => {
        cy.getByTestId('emission-source-status').should('be.visible').invoke('text').should('contain', 'À vérifier')
        cy.getByTestId('emission-source-value').should('be.visible').should('have.text', '1 008 tCO₂e')
        cy.getByTestId('emission-source-quality').should('be.visible').should('have.text', 'Qualité : Mauvaise')
      })
    cy.getByTestId('emission-source-quality-expand-button').should('not.exist')
    cy.getByTestId('emission-source-result')
      .should('be.visible')
      .should('have.text', 'Intervalle de confiance à 95% :[437; 2 328] (en tCO₂e)Alpha :130,87%')
    cy.getByTestId('emission-source-technicalRepresentativeness').should('be.visible').click()
    cy.get('[data-value="1"]').click()
    cy.getByTestId('emission-source-result').should(
      'have.text',
      'Intervalle de confiance à 95% :[437; 2 328] (en tCO₂e)Alpha :130,87%',
    )
    cy.getByTestId('emission-source-geographicRepresentativeness').should('be.visible').click()
    cy.get('[data-value="4"]').click()
    cy.getByTestId('emission-source-temporalRepresentativeness').should('be.visible').click()
    cy.get('[data-value="4"]').click()
    cy.getByTestId('emission-source-completeness').should('be.visible').click()
    cy.get('[data-value="5"]').click()
    cy.getByTestId('emission-source-comment').should('be.visible').type('My comment', { delay: 0 })

    cy.getByTestId('emission-source-validate').should('be.visible').click()
    cy.getByTestId('emission-source-status').should('be.visible').invoke('text').should('contain', 'Enregistré')

    cy.getByTestId('emission-source-My emission source name')
      .first()
      .within(() => {
        cy.getByTestId('emission-source-status').should('be.visible').should('have.text', 'Validée')
        cy.getByTestId('emission-source-value').should('be.visible').should('have.text', '1 008 tCO₂e')
        cy.getByTestId('emission-source-quality').should('be.visible').should('have.text', 'Qualité : Mauvaise')
        cy.get('[data-testid="emission-source-name"] > .MuiInputBase-root > .MuiInputBase-input').should('not.exist')
        cy.getByTestId('validated-emission-source-name')
          .should('be.visible')
          .should('have.text', 'My emission source name')
      })

    cy.getByTestId('duplicate-emission-source').should('be.visible').click()
    cy.getByTestId('duplicate-confirm').should('be.visible').click()

    cy.getByTestId('emission-source-My emission source name - copie')
      .first()
      .within(() => {
        cy.getByTestId('emission-source-status').should('be.visible').should('have.text', 'À vérifier')
        cy.getByTestId('emission-source-status').last().click()
        cy.getByTestId('emission-source-value').should('be.visible').should('have.text', '1 008 tCO₂e')
        cy.getByTestId('emission-source-quality').should('be.visible').should('have.text', 'Qualité : Mauvaise')
      })
    cy.getByTestId('emission-source-tag').last().should('contain', 'Numérique')

    cy.logout()
    cy.login('bc-gestionnaire-0@yopmail.com')
    cy.url().should('eq', `${Cypress.config().baseUrl}/?fromLogin`)
    cy.visit(`/etudes/${studyId}/comptabilisation/saisie-des-donnees/IntrantsBiensEtMatieres`)
    cy.wait('@pageLoad')
    cy.getByTestId('subpost').first().should('be.visible').scrollIntoView().click({ force: true })
    cy.getByTestId('new-emission-source').should('be.visible')

    cy.getByTestId('emission-source-My emission source name - copie')
      .last()
      .within(() => {
        cy.getByTestId('emission-source-status').should('be.visible').invoke('text').should('contain', 'À vérifier')
        cy.getByTestId('emission-source-value').should('be.visible').should('have.text', '1 008 tCO₂e')
        cy.getByTestId('emission-source-quality').should('be.visible').should('have.text', 'Qualité : Mauvaise')
      })
    cy.getByTestId('emission-source-My emission source name - copie').last().click({ force: true })
    cy.getByTestId('emission-source-My emission source name - copie')
      .last()
      .within(() => {
        cy.get('[data-testid="emission-source-name"] > .MuiInputBase-root > .MuiInputBase-input')
          .should('be.visible')
          .should('have.value', 'My emission source name - copie')
        cy.get('[data-testid="emission-source-name"] > .MuiInputBase-root > .MuiInputBase-input').should(
          'not.be.disabled',
        )
        cy.getByTestId('emission-source-name').scrollIntoView().clear()
        cy.getByTestId('emission-source-name').type('My edited emission source name', { delay: 0 })
        cy.get('[data-testid="emission-source-name"] > .MuiInputBase-root > .MuiInputBase-input').blur()
        cy.getByTestId('emission-source-status').should('be.visible').should('contain', 'Enregistré')
      })
    cy.getByTestId('emission-source-validate').should('not.exist')

    cy.logout()
    cy.login('bc-collaborator-1@yopmail.com', 'password-1')
    cy.url().should('eq', `${Cypress.config().baseUrl}/?fromLogin`)
    cy.visit(`/etudes/${studyId}/comptabilisation/saisie-des-donnees/IntrantsBiensEtMatieres`)
    cy.wait('@pageLoad')
    cy.getByTestId('subpost').first().should('be.visible').click()
    cy.getByTestId('new-emission-source').should('not.exist')
    cy.getByTestId('emission-source-My edited emission source name')
      .first()
      .within(() => {
        cy.getByTestId('emission-source-status').should('be.visible').invoke('text').should('contain', 'À vérifier')
        cy.getByTestId('emission-source-value').should('be.visible').should('have.text', '1 008 tCO₂e')
        cy.getByTestId('emission-source-quality').should('be.visible').should('have.text', 'Qualité : Mauvaise')
      })
    cy.getByTestId('emission-source-My edited emission source name').click()
    cy.getByTestId('emission-source-My edited emission source name')
      .first()
      .within(() => {
        cy.get('[data-testid="emission-source-name"] > .MuiInputBase-root > .MuiInputBase-input')
          .should('be.visible')
          .should('have.value', 'My edited emission source name')
        cy.get('[data-testid="emission-source-name"] > .MuiInputBase-root > .MuiInputBase-input').should('be.disabled')
      })
    cy.getByTestId('emission-source-validate').should('not.exist')

    cy.logout()

    cy.login('bc-contributor@yopmail.com', 'password')
    cy.url().should('eq', `${Cypress.config().baseUrl}/?fromLogin`)
    cy.visit(`/etudes/${studyId}/comptabilisation/saisie-des-donnees/IntrantsBiensEtMatieres`)
    cy.wait('@pageLoad')
    cy.url().should('eq', `${Cypress.config().baseUrl}/etudes/${studyId}/contributeur`)

    cy.getByTestId('subpost').first().should('be.visible').click()
    cy.getByTestId('new-emission-source').should('not.exist')
    cy.getByTestId('emission-source-My edited emission source name')
      .first()
      .within(() => {
        cy.getByTestId('emission-source-status').should('be.visible').invoke('text').should('contain', 'À vérifier')
        cy.getByTestId('emission-source-value').should('be.visible').should('have.text', '1 008 tCO₂e')
        cy.getByTestId('emission-source-quality').should('be.visible').should('have.text', 'Qualité : Mauvaise')
        cy.getByTestId('emission-source-last-editor').should('not.exist')
      })
    cy.getByTestId('emission-source-My edited emission source name').click({ force: true })
    cy.getByTestId('emission-source-My edited emission source name')
      .first()
      .within(() => {
        cy.getByTestId('emission-source-name').should('not.exist')
        cy.getByTestId('validated-emission-source-name').should('be.visible')
        cy.getByTestId('validated-emission-source-name').should('have.text', 'My edited emission source name')
      })
    cy.getByTestId('emission-source-validate').should('not.exist')
    cy.get('[data-testid="emission-source-value-da"] > .MuiInputBase-root > .MuiInputBase-input')
      .should('be.visible')
      .should('have.value', '456')
    cy.getByTestId('emission-source-value-da').clear()
    cy.getByTestId('emission-source-value-da').type('789', { delay: 0 })
    cy.get('[data-testid="emission-source-value-da"] > .MuiInputBase-root > .MuiInputBase-input').blur()
    cy.getByTestId('emission-source-status').should('be.visible').invoke('text').should('contain', 'Enregistré')
    cy.getByTestId('emission-source-last-editor').should('be.visible').should('contain.text', 'Dernière modification')

    cy.getByTestId('emission-source-My edited emission source name')
      .first()
      .within(() => {
        cy.getByTestId('emission-source-status').should('be.visible').invoke('text').should('contain', 'À vérifier')
        cy.getByTestId('emission-source-value').should('be.visible').should('have.text', '1 744 tCO₂e')
        cy.getByTestId('emission-source-quality').should('be.visible').should('have.text', 'Qualité : Mauvaise')
      })
  })
})
