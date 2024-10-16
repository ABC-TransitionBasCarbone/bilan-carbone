import '@testing-library/cypress/add-commands'

Cypress.Commands.add('login', (email?: string, password?: string) => {
  cy.visit('/')

  cy.get('[data-testid="input-email"] > .MuiInputBase-input')
    .should('be.visible')
    .type(email || 'bc-test-user-1@yopmail.com')
  cy.get('[data-testid="input-password"] > .MuiInputBase-input')
    .should('be.visible')
    .type(password || 'password-1')
  cy.get('[data-testid="login-button"]').click()

  cy.url().should('not.include', '/login')
})

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      login: (email?: string, password?: string) => Chainable<void>
    }
  }
}
