import './commands'

beforeEach(() => {
  cy.intercept('POST', '/api/auth/callback/credentials').as('login')
  cy.intercept('POST', '/api/auth/signout').as('logout')
  cy.intercept('POST', '/count/register').as('signupCut')
})

Cypress.on('uncaught:exception', () => {
  return false
})
