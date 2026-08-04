describe('Delete study', () => {
  beforeEach(() => {
    cy.resetTestDatabase()
  })

  it('should be able to delete a study', () => {
    cy.login('bc-admin-0@yopmail.com', 'password-0')

    cy.getByTestId('study-name-chip')
      .contains('Study to delete')
      .scrollIntoView()
      .parents('[data-testid="study"]')
      .within(() => {
        cy.getByTestId('study-link').click()
      })

    cy.url().should('include', '/comptabilisation/saisie-des-donnees')
    cy.getByTestId('delete-study').click()
    cy.get('#delete-study-modal-title').should('be.visible')
    cy.get('#delete-study-modal-content').should('be.visible')

    cy.getByTestId('delete-study-name-field').type('Study to delet')
    cy.getByTestId('alert-toaster').should('not.exist')
    cy.getByTestId('confirm-study-deletion').click()
    cy.getByTestId('alert-toaster').should('be.visible')
    cy.getByTestId('alert-toaster').should('contain.text', "Le nom de l'étude ne correspond pas")

    cy.getByTestId('delete-study-name-field').type('e')

    cy.url().then((savedUrl) => {
      cy.getByTestId('confirm-study-deletion').click()
      cy.getByTestId('alert-toaster').should('not.exist')

      cy.url().should('eq', `${Cypress.config().baseUrl}/`)

      cy.visit(savedUrl)
      cy.getByTestId('not-found-page').should('be.visible')
    })
  })
})
