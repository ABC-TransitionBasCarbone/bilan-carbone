Cypress.Commands.add(
  'getByTestId',
  (testId: string, params?: Partial<Cypress.Loggable & Cypress.Timeoutable & Cypress.Withinable & Cypress.Shadow>) =>
    cy.get(`[data-testid="${testId}"]`, params),
)

Cypress.Commands.add('resetTestDatabase', () => {
  cy.exec('yarn db:test:reset')
})

Cypress.Commands.add('login', (email = 'mip-admin-0@yopmail.com', password = 'password-0') => {
  cy.visit('/login')
  cy.get('[data-testid="input-email"] > .MuiInputBase-root > .MuiInputBase-input')
    .should('be.visible')
    .should('not.be.disabled')
    .type(email)
  cy.get('[data-testid="input-password"] > .MuiInputBase-root > .MuiInputBase-input').type(password)
  cy.getByTestId('login-button').click()
  cy.wait(`@login`)
})

Cypress.Commands.add('logout', () => {
  cy.visit('/logout')
  cy.wait(`@logout`)
})
