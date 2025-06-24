describe('Emission factors table', () => {
  before(() => {
    cy.exec('npx prisma db seed')
  })

  it('Should be able to display archived emission factors', () => {
    cy.login()
    cy.visit('/facteurs-d-emission')

    cy.getByTestId('archived-emissions-factors-switch').within(() => {
      cy.get('input').should('not.be.checked')
    })

    cy.getByTestId('emission-factor-search-input').within(() => {
      cy.get('input').type('Archived')
    })
    cy.getByTestId('cell-emission-name').should('have.length', 0)

    cy.getByTestId('emission-factor-search-input').within(() => {
      cy.get('input').clear()
    })
    cy.getByTestId('archived-emissions-factors-switch').within(() => {
      cy.get('input').click()
    })
    cy.getByTestId('emission-factor-search-input').within(() => {
      cy.get('input').type('Archived')
    })
    cy.getByTestId('cell-emission-name').should('have.length', 1)
    cy.getByTestId('cell-emission-name').first().should('have.text', 'FE Test Archived')
  })
})
