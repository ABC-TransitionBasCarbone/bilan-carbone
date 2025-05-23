Cypress.Commands.add('getByTestId', (testId: string) => cy.get(`[data-testid="${testId}"]`))

Cypress.Commands.add('login', (email = 'bc-collaborator-0@yopmail.com', password = 'password-0') => {
  cy.visit('/login')
  cy.get('[data-testid="input-email"] > .MuiInputBase-root > .MuiInputBase-input').should('be.visible').type(email)
  cy.get('[data-testid="input-password"] > .MuiInputBase-root > .MuiInputBase-input').type(password)
  cy.getByTestId('login-button').click()
  cy.wait(`@login`)
})

Cypress.Commands.add('logout', () => {
  cy.visit('/logout')
  cy.wait(`@logout`)
})
