import './commands'

beforeEach(() => {
  cy.intercept('POST', '/api/auth/callback/credentials').as('login')
  cy.intercept('POST', '/api/auth/signout').as('logout')
})

Cypress.on('uncaught:exception', () => {
  return false
})
