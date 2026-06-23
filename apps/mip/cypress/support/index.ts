import './commands'

beforeEach(() => {
  cy.intercept('POST', '/api/auth/callback/credentials').as('login')
})

Cypress.on('uncaught:exception', () => {
  return false
})
