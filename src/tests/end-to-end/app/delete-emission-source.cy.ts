describe('Delete emission source', () => {
  before(() => {
    cy.exec('yarn db:test:reset')
  })

  it('should be able to delete an emission source on a study', () => {
    cy.login()

    cy.visit('/etudes/88c93e88-7c80-4be4-905b-f0bbd2ccc779/comptabilisation/saisie-des-donnees/IntrantsBiensEtMatieres')
    cy.getByTestId('subpost').first().click({ force: true })

    cy.getByTestId('new-emission-source').first().type('My temp emission source{enter}')

    cy.getByTestId('emission-source-My temp emission source').should('exist')

    cy.getByTestId('emission-source-My temp emission source').click()
    cy.getByTestId('emission-source-delete').click()
    cy.getByTestId('delete-emission-source-modal-accept').click()

    cy.getByTestId('emission-source-My temp emission source').should('not.exist')
  })
})
