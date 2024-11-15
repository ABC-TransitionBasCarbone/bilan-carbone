import { time } from 'console'

Cypress.Commands.add('getByTestId', (testId: string) => cy.get(`[data-testid="${testId}"]`))

Cypress.Commands.add('login', (email = 'bc-default-0@yopmail.com', password = 'password-0') => {
  cy.intercept('POST', '/api/auth/callback/credentials').as('login')
  cy.visit('/login')
  cy.get('[data-testid="input-email"] > .MuiInputBase-root > .MuiInputBase-input').should('be.visible').type(email)
  cy.get('[data-testid="input-password"] > .MuiInputBase-root > .MuiInputBase-input').type(password)
  cy.getByTestId('login-button').click()
  cy.url().should('eq', `${Cypress.config().baseUrl}/`)
})

Cypress.Commands.add('logout', () => {
  cy.intercept('POST', '/api/auth/callback/credentials').as('login')
  cy.visit('/logout')

  cy.url().should('eq', `${Cypress.config().baseUrl}/login`, { timeout: 10000 })
})
