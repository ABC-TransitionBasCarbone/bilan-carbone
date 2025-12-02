Cypress.Commands.add(
  'getByTestId',
  (testId: string, params?: Partial<Cypress.Loggable & Cypress.Timeoutable & Cypress.Withinable & Cypress.Shadow>) =>
    cy.get(`[data-testid="${testId}"]`, params),
)

Cypress.Commands.add('login', (email = 'bc-collaborator-0@yopmail.com', password = 'password-0') => {
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

Cypress.Commands.add('signupCut', (email = 'cut-cnc@yopmail.com', cncOrSiret = '321') => {
  cy.visit('/count/register')

  cy.getByTestId('activation-email').should('be.visible')
  cy.getByTestId('activation-siretOrCNC').should('be.visible')
  cy.getByTestId('activation-button').should('be.visible')

  cy.getByTestId('activation-email').type(email)
  cy.getByTestId('activation-siretOrCNC').type(cncOrSiret)
  cy.getByTestId('activation-form-message').should('not.exist')
  cy.getByTestId('activation-button').click()

  cy.wait('@signupCut')
})
