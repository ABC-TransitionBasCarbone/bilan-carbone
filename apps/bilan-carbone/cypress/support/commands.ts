Cypress.Commands.add(
  'getByTestId',
  (testId: string, params?: Partial<Cypress.Loggable & Cypress.Timeoutable & Cypress.Withinable & Cypress.Shadow>) =>
    cy.get(`[data-testid="${testId}"]`, params),
)

const ENV_LOGIN_DEFAULTS: Record<string, { email: string; password: string }> = {
  bc: { email: 'bc-collaborator-0@yopmail.com', password: 'password-0' },
  cut: { email: 'cut-env-admin-0@yopmail.com', password: 'password-0' },
  tilt: { email: 'tilt-env-admin-0@yopmail.com', password: 'password-0' },
  clickson: { email: 'clickson-env-admin-0@yopmail.com', password: 'password-0' },
}

const ENV_ENTRY_PATHS: Record<string, string> = {
  bc: '/login',
  cut: '/count',
  tilt: '/tilt',
  clickson: '/clickson',
}

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

Cypress.Commands.add('loginForEnv', (env: 'bc' | 'cut' | 'tilt' | 'clickson', email?: string, password?: string) => {
  const defaults = ENV_LOGIN_DEFAULTS[env]
  const loginEmail = email ?? defaults.email
  const loginPassword = password ?? defaults.password
  const entryPath = ENV_ENTRY_PATHS[env]
  cy.visit(entryPath)
  cy.url().should('include', entryPath)
  cy.get('[data-testid="input-email"] > .MuiInputBase-root > .MuiInputBase-input')
    .should('be.visible')
    .should('not.be.disabled')
    .type(loginEmail)
  cy.get('[data-testid="input-password"] > .MuiInputBase-root > .MuiInputBase-input').type(loginPassword)
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

Cypress.Commands.add('resetTestDatabase', () => {
  cy.exec('yarn db:test:reset')
})
