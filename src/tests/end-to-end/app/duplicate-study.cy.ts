describe('Delete study', () => {
  before(() => {
    cy.resetTestDatabase()
  })

  beforeEach(() => {
    cy.intercept('POST', '/etudes/creer').as('create')
    cy.intercept('POST', '/etudes/*').as('delete')
  })

  it('Should be able to duplicate a study', () => {
    cy.login('all-env-admin-0@yopmail.com', 'password-0')
    cy.url({ timeout: 5000 }).should('eq', `${Cypress.config().baseUrl}/selection-du-compte`)
    cy.contains('li', 'BC+').click()
    cy.url({ timeout: 10000 }).should('eq', `${Cypress.config().baseUrl}/`)

    cy.getByTestId('study')
      .contains('BC V8.10')
      .scrollIntoView()
      .parents('[data-testid="study"]')
      .within(() => {
        cy.getByTestId('study-link').click()
      })

    cy.getByTestId('duplicate-study').click()
    cy.get('#duplicate-study-modal-title').should('be.visible')
    cy.get('#duplicate-study-modal-description').should('be.visible')

    cy.getByTestId('duplication-modale-text').invoke('text').should('contain', 'Vous serez redirigé vers la page')

    cy.getByTestId('environment-selector').should('be.visible').click()
    cy.get('[data-value="TILT"]').click()

    cy.getByTestId('duplication-modale-text').invoke('text').should('contain', 'Tilt')
    cy.getByTestId('duplicate-study-confirm').click()

    cy.getByTestId('duplicated-description', { timeout: 15000 }).should('be.visible') // wait for duplication to be finished
    cy.get('#duplicate-study-modal-title', { timeout: 6000 }).should('not.exist') // wait for modale to be close after 5 seconds

    cy.logout()

    cy.login('all-env-admin-0@yopmail.com', 'password-0')
    cy.url({ timeout: 5000 }).should('eq', `${Cypress.config().baseUrl}/selection-du-compte`)
    cy.contains('li', 'Tilt').click()
    cy.url({ timeout: 10000 }).should('eq', `${Cypress.config().baseUrl}/`)

    cy.getByTestId('study').contains('BC V8.10').scrollIntoView().should('be.visible')
  })
})
