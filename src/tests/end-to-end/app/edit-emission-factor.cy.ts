describe('Edit emission factor', () => {
  before(() => {
    cy.resetTestDatabase()
  })

  beforeEach(() => {
    cy.intercept('POST', '/facteurs-d-emission/creer').as('create')
    cy.intercept('POST', '/facteurs-d-emission/*/modifier').as('update')
  })

  it('should be able to edit an emission factor from your organization', () => {
    cy.login()
    cy.getByTestId('navbar-facteur-demission').click()
    cy.getByTestId('emission-factor-search-input').within(() => {
      cy.get('input').type('My FE to edit')
    })
    cy.getByTestId('edit-emission-factor-button').first().click()
    cy.get('#edit-emission-factor-modal-title').should('be.visible')
    cy.getByTestId('edit-emission-factor-confirm').click()
    const uuidRegex = /\/facteurs-d-emission\/[0-9a-fA-F-]{36}\/modifier/
    cy.url().should('match', uuidRegex)
    // check original values
    cy.getByTestId('emission-factor-detailed-switch').within(() => {
      cy.get('input').should('be.checked')
    })
    cy.getByTestId('emission-factor-multiple-switch').within(() => {
      cy.get('input').should('be.checked')
    })
    cy.getByTestId('emission-factor-name').within(() => {
      cy.get('input').should('have.value', 'My FE to edit')
    })
    cy.getByTestId('emission-factor-unit').within(() => {
      cy.get('input').should('have.value', 'GWH')
    })
    cy.getByTestId('emission-factor-parts-count').within(() => {
      cy.get('input').should('have.value', 2)
    })
    cy.getByTestId('emission-factor-subPost').invoke('text').should('include', 'Électricité')
    // edit values
    cy.getByTestId('emission-factor-name').type(' - EDITED')
    cy.getByTestId('emission-factor-unit').click()
    cy.get('[data-value="GO"]').click()
    cy.getByTestId('emission-part-row').each((row, index) => {
      if (row.text().includes('My first part')) {
        cy.getByTestId(`delete-emission-part-${index}`).click()
      }
    })
    cy.getByTestId('emission-part-0-expand').click()
    cy.getByTestId('emission-factor-part-0-name').type(' - EDITED')
    cy.getByTestId('emission-factor-part-0-co2f').type('0')
    cy.getByTestId('emission-factor-part-0-ch4f').type('0')
    cy.getByTestId('emission-factor-part-0-ch4b').type('0')
    cy.getByTestId('emission-factor-part-0-n2o').type('0')
    cy.getByTestId('emission-factor-part-0-co2b').type('0')
    cy.getByTestId('emission-factor-part-0-sf6').type('0')
    cy.getByTestId('emission-factor-part-0-hfc').type('0')
    cy.getByTestId('emission-factor-part-0-pfc').type('0')
    cy.getByTestId('emission-factor-part-0-otherGES').type('0')
    cy.getByTestId('emission-factor-totalCo2').within(() => {
      cy.get('input').should('be.disabled')
      cy.get('input').should('have.value', '440')
    })
    cy.getByTestId('emission-factor-post').click()
    cy.get('[data-value="Deplacements"]').click()
    cy.getByTestId('emission-factor-subPost').eq(1).click()
    cy.get('[data-value="DeplacementsDomicileTravail"]').click()
    cy.get('body').type('{esc}')
    cy.getByTestId('emission-factor-valid-button').click()
    cy.wait('@update')
    cy.url().should('eq', `${Cypress.config().baseUrl}/facteurs-d-emission`)
    cy.getByTestId('emission-factor-search-input').within(() => {
      cy.get('input').type('My FE to edit - EDITED')
    })
    cy.getByTestId('cell-emission-name').first().should('have.text', 'My FE to edit - EDITED')
    cy.getByTestId('cell-emission-Valeur').first().should('have.text', '440 kgCO₂e/Go')
  })

  it('should be able to delete an emission factor from your organization', () => {
    cy.login()
    cy.visit('/facteurs-d-emission')
    cy.getByTestId('emission-factor-search-input').within(() => {
      cy.get('input').type('My FE to edit - EDITED')
    })
    cy.getByTestId('cell-emission-name').should('have.length', 1)
    cy.getByTestId('delete-emission-factor-button').first().click()
    cy.get('#delete-emission-factor-modal-title').should('be.visible')
    cy.getByTestId('delete-emission-factor-confirm').click()
    cy.getByTestId('cell-emission-name').should('have.length', 0)
  })
})
