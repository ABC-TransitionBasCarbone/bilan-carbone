describe('Survey completion', () => {
  before(() => {
    cy.resetTestDatabase()
  })

  it('renders completion page and keeps it after refresh', () => {
    cy.visit('/end/campaign-admin-seed-id')

    cy.getByTestId('survey-completion-footprint-banner').should('be.visible')
    cy.getByTestId('survey-completion-actions').should('be.visible')

    cy.reload()

    cy.url().should('include', '/end/campaign-admin-seed-id')
    cy.getByTestId('survey-completion-footprint-banner').should('be.visible')
  })
})
