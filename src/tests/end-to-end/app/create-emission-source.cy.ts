describe('Create study emission source', () => {
  const studyId = '88c93e88-7c80-4be4-905b-f0bbd2ccc779'

  before(() => {
    cy.resetTestDatabase()
  })

  it('should create an emission source on a study', () => {
    cy.login()

    cy.url().should('eq', `${Cypress.config().baseUrl}/?fromLogin`)
    cy.visit(`/etudes/${studyId}/comptabilisation/saisie-des-donnees/IntrantsBiensEtMatieres`)

    cy.getByTestId('subpost').first().scrollIntoView()

    cy.getByTestId('subpost').first().click({ force: true })

    cy.getByTestId('new-emission-source').first().scrollIntoView()
    cy.getByTestId('new-emission-source').first().type('My new emission source{enter}')

    cy.getByTestId('emission-source-My new emission source').should('exist')
    cy.getByTestId('emission-source-My new emission source').within(() => {
      cy.getByTestId('emission-source-status').should('have.text', "En attente d'un·e contributeur·rice")
      cy.getByTestId('emission-source-quality').should('not.exist')
    })

    cy.getByTestId('emission-source-My new emission source').click()

    cy.getByTestId('emission-source-validate').should('be.disabled')

    cy.getByTestId('emission-source-My new emission source').within(() => {
      cy.get('[data-testid="emission-source-name"] > .MuiInputBase-root > .MuiInputBase-input').should(
        'have.value',
        'My new emission source',
      )
      cy.getByTestId('emission-source-name').clear()
      cy.getByTestId('emission-source-name').type('My emission source name')
    })

    cy.getByTestId('emission-source-factor').should('not.exist')
    cy.getByTestId('emission-source-factor-search').scrollIntoView().type('acier ou fer blanc')
    cy.getByTestId('emission-source-factor-suggestion').first().click()
    cy.getByTestId('emission-source-factor').should('exist')

    cy.getByTestId('emission-source-value-da').type('456')

    cy.getByTestId('emission-source-My new emission source').should('not.exist')
    cy.getByTestId('emission-source-My emission source name').should('exist')

    cy.getByTestId('emission-source-My emission source name').within(() => {
      cy.get('[data-testid="emission-source-status"] > div')
        .invoke('text')
        .should('contain', "En attente d'un·e contributeur·rice")
    })

    cy.getByTestId('emission-source-source').type('My source')
    cy.getByTestId('emission-source-type').click()
    cy.get('[data-value="Physical"]').click()

    cy.getByTestId('emission-source-My emission source name').within(() => {
      cy.get('[data-testid="emission-source-status"] > div').invoke('text').should('contain', 'À vérifier')
      cy.getByTestId('emission-source-value').should('have.text', '1 008 tCO₂e')
      cy.getByTestId('emission-source-quality').should('not.exist')
    })

    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="emission-source-quality-select"]').length) {
        cy.getByTestId('emission-source-quality-expand-button').click()
      }
    })
    cy.getByTestId('emission-source-reliability').click()
    cy.get('[data-value="4"]').click()
    cy.getByTestId('emission-source-status').invoke('text').should('contain', 'Enregistré')

    cy.getByTestId('emission-source-tag').click()
    cy.getByTestId('tag-option').first().click()
    cy.getByTestId('emission-source-tag').should('contain', 'Numérique')

    cy.getByTestId('emission-source-My emission source name').within(() => {
      cy.getByTestId('emission-source-status').invoke('text').should('contain', 'À vérifier')
      cy.getByTestId('emission-source-value').should('have.text', '1 008 tCO₂e')
      cy.getByTestId('emission-source-quality').should('have.text', 'Qualité : Bonne')
    })
    cy.getByTestId('emission-source-quality-expand-button').should('not.exist')
    cy.getByTestId('emission-source-result').should(
      'have.text',
      'Intervalle de confiance à 95% :[900; 1 129] (en tCO₂e)Alpha :11,99%',
    )
    cy.getByTestId('emission-source-technicalRepresentativeness').click()
    cy.get('[data-value="1"]').click()
    cy.getByTestId('emission-source-result').should(
      'have.text',
      'Intervalle de confiance à 95% :[499; 2 035] (en tCO₂e)Alpha :101,85%',
    )
    cy.getByTestId('emission-source-geographicRepresentativeness').click()
    cy.get('[data-value="2"]').click()
    cy.getByTestId('emission-source-temporalRepresentativeness').click()
    cy.get('[data-value="3"]').click()
    cy.getByTestId('emission-source-completeness').click()
    cy.get('[data-value="5"]').click()
    cy.getByTestId('emission-source-comment').type('My comment')

    cy.getByTestId('emission-source-validate').click()
    cy.getByTestId('emission-source-status').invoke('text').should('contain', 'Enregistré')

    cy.getByTestId('emission-source-My emission source name').within(() => {
      cy.getByTestId('emission-source-status').should('have.text', 'Validée')
      cy.getByTestId('emission-source-value').should('have.text', '1 008 tCO₂e')
      cy.getByTestId('emission-source-quality').should('have.text', 'Qualité : Mauvaise')
      cy.get('[data-testid="emission-source-name"] > .MuiInputBase-root > .MuiInputBase-input').should('not.exist')
      cy.getByTestId('validated-emission-source-name').should('have.text', 'My emission source name')
    })

    cy.getByTestId('duplicate-emission-source').click()
    cy.getByTestId('duplicate-confirm').click()

    cy.getByTestId('emission-source-My emission source name - copie')
      .first()
      .within(() => {
        cy.getByTestId('emission-source-status').should('have.text', 'À vérifier')
        cy.getByTestId('emission-source-status').last().click()
        cy.getByTestId('emission-source-value').should('have.text', '1 008 tCO₂e')
        cy.getByTestId('emission-source-quality').should('have.text', 'Qualité : Mauvaise')
      })
    cy.getByTestId('emission-source-tag').last().should('contain', 'Numérique')

    // Editor can add source, edit but not validate
    cy.logout()
    cy.login('bc-gestionnaire-0@yopmail.com')
    cy.url().should('eq', `${Cypress.config().baseUrl}/?fromLogin`)
    cy.visit(`/etudes/${studyId}/comptabilisation/saisie-des-donnees/IntrantsBiensEtMatieres`)
    cy.getByTestId('subpost').first().scrollIntoView().click({ force: true })
    cy.getByTestId('new-emission-source').should('exist')

    cy.getByTestId('emission-source-My emission source name - copie')
      .last()
      .within(() => {
        cy.getByTestId('emission-source-status').invoke('text').should('contain', 'À vérifier')
        cy.getByTestId('emission-source-value').should('have.text', '1 008 tCO₂e')
        cy.getByTestId('emission-source-quality').should('have.text', 'Qualité : Mauvaise')
      })
    cy.getByTestId('emission-source-My emission source name - copie').last().click({ force: true })
    cy.getByTestId('emission-source-My emission source name - copie')
      .last()
      .within(() => {
        cy.get('[data-testid="emission-source-name"] > .MuiInputBase-root > .MuiInputBase-input').should(
          'have.value',
          'My emission source name - copie',
        )
        cy.get('[data-testid="emission-source-name"] > .MuiInputBase-root > .MuiInputBase-input').should(
          'not.be.disabled',
        )
        cy.getByTestId('emission-source-name').scrollIntoView().clear()
        cy.getByTestId('emission-source-name').type('My edited emission source name')
        cy.get('[data-testid="emission-source-name"] > .MuiInputBase-root > .MuiInputBase-input').blur()
        cy.getByTestId('emission-source-status').should('contain', 'Enregistré')
      })
    cy.getByTestId('emission-source-validate').should('not.exist')

    // Reader can only read
    cy.logout()
    cy.login('bc-collaborator-1@yopmail.com', 'password-1')
    cy.url().should('eq', `${Cypress.config().baseUrl}/?fromLogin`)
    cy.visit(`/etudes/${studyId}/comptabilisation/saisie-des-donnees/IntrantsBiensEtMatieres`)
    cy.getByTestId('subpost').first().click()
    cy.getByTestId('new-emission-source').should('not.exist')
    cy.getByTestId('emission-source-My edited emission source name').within(() => {
      cy.getByTestId('emission-source-status').invoke('text').should('contain', 'À vérifier')
      cy.getByTestId('emission-source-value').should('have.text', '1 008 tCO₂e')
      cy.getByTestId('emission-source-quality').should('have.text', 'Qualité : Mauvaise')
    })
    cy.getByTestId('emission-source-My edited emission source name').click()
    cy.getByTestId('emission-source-My edited emission source name').within(() => {
      cy.get('[data-testid="emission-source-name"] > .MuiInputBase-root > .MuiInputBase-input').should(
        'have.value',
        'My edited emission source name',
      )
      cy.get('[data-testid="emission-source-name"] > .MuiInputBase-root > .MuiInputBase-input').should('be.disabled')
    })
    cy.getByTestId('emission-source-validate').should('not.exist')

    // Contributor can only contribute specific field
    cy.logout()

    cy.login('bc-contributor@yopmail.com', 'password')
    cy.url().should('eq', `${Cypress.config().baseUrl}/?fromLogin`)
    cy.visit(`/etudes/${studyId}/comptabilisation/saisie-des-donnees/IntrantsBiensEtMatieres`)
    cy.url().should('eq', `${Cypress.config().baseUrl}/etudes/${studyId}/contributeur`)

    cy.getByTestId('subpost').first().click()
    cy.getByTestId('new-emission-source').should('not.exist')
    cy.getByTestId('emission-source-My edited emission source name').within(() => {
      cy.getByTestId('emission-source-status').invoke('text').should('contain', 'À vérifier')
      cy.getByTestId('emission-source-value').should('have.text', '1 008 tCO₂e')
      cy.getByTestId('emission-source-quality').should('have.text', 'Qualité : Mauvaise')
      cy.getByTestId('emission-source-contributor').should('not.exist')
    })
    cy.getByTestId('emission-source-My edited emission source name').click({ force: true })
    cy.getByTestId('emission-source-My edited emission source name').within(() => {
      cy.getByTestId('emission-source-name').should('not.exist')
      cy.getByTestId('validated-emission-source-name').should('exist')
      cy.getByTestId('validated-emission-source-name').should('have.text', 'My edited emission source name')
    })
    cy.getByTestId('emission-source-validate').should('not.exist')
    cy.get('[data-testid="emission-source-value-da"] > .MuiInputBase-root > .MuiInputBase-input').should(
      'have.value',
      '456',
    )
    cy.getByTestId('emission-source-value-da').clear()
    cy.getByTestId('emission-source-value-da').type('789')
    cy.get('[data-testid="emission-source-value-da"] > .MuiInputBase-root > .MuiInputBase-input').blur()
    cy.getByTestId('emission-source-status').invoke('text').should('contain', 'Enregistré')

    cy.getByTestId('emission-source-My edited emission source name').within(() => {
      cy.getByTestId('emission-source-status').invoke('text').should('contain', 'À vérifier')
      cy.getByTestId('emission-source-value').should('have.text', '1 744 tCO₂e')
      cy.getByTestId('emission-source-quality').should('have.text', 'Qualité : Mauvaise')
      cy.getByTestId('emission-source-contributor').should('have.text', 'bc-contributor@yopmail.com')
    })
  })
})
