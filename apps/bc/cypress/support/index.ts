import './commands'

beforeEach(() => {
  cy.intercept('POST', '/api/auth/callback/credentials').as('login')
  cy.intercept('POST', '/api/auth/signout').as('logout')
  cy.intercept('POST', '/count/register').as('signupCut')
  cy.intercept('POST', '/clickson/register').as('signupClickson')
})

Cypress.on('uncaught:exception', () => {
  return false
})
