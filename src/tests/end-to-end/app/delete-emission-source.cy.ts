describe('Create study', () => {
  beforeEach(() => {
    cy.exec('npx prisma db seed')
  })

  it('should create an emission source on a study', () => {
    cy.login()

    cy.visit('/etudes/88c93e88-7c80-4be4-905b-f0bbd2ccc779/comptabilisation/saisie-des-donnees/IntrantsBiensEtMatieres')
    cy.getByTestId('subpost').first().click()

    cy.getByTestId('new-emission-source').first().type('My temp emission source{enter}')

    cy.getByTestId('emission-source-My temp emission source').should('exist')

    cy.getByTestId('emission-source-My temp emission source').click()
    cy.getByTestId('emission-source-delete').click()
    cy.getByTestId('delete-emission-source-dialog-accept').click()

    cy.getByTestId('emission-source-My temp emission source').should('not.exist')
  })
})
