Cypress.Commands.add('login', (email = 'bc-test-user-0@yopmail.com', password = 'password-0') => {
  cy.intercept('POST', '/api/auth/callback/credentials').as('login')
  cy.visit('/login')
  cy.get('[data-testid="input-email"] > .MuiInputBase-input').should('be.visible').type(email)
  cy.get('[data-testid="input-password"] > .MuiInputBase-input').type(password)
  cy.get('[data-testid="login-button"]').click()
  cy.wait('@login')
})
