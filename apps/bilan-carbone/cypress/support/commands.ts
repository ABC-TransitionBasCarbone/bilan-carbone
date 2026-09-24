import { Environment } from '@abc-transitionbascarbone/db-common/enums'
import { AllBCEnvironments } from '@abc-transitionbascarbone/utils/types'

Cypress.Commands.add(
  'getByTestId',
  (testId: string, params?: Partial<Cypress.Loggable & Cypress.Timeoutable & Cypress.Withinable & Cypress.Shadow>) =>
    cy.get(`[data-testid="${testId}"]`, params),
)

const ENV_LOGIN_DEFAULTS: Record<AllBCEnvironments, { email: string; password: string }> = {
  [Environment.BC]: { email: 'bc-collaborator-0@yopmail.com', password: 'password-0' },
  [Environment.FORMATION_BC]: { email: 'formation_bc-env-admin-0@yopmail.com', password: 'password-0' },
  [Environment.CUT]: { email: 'cut-env-admin-0@yopmail.com', password: 'password-0' },
  [Environment.TILT]: { email: 'tilt-env-admin-0@yopmail.com', password: 'password-0' },
  [Environment.CLICKSON]: { email: 'clickson-env-admin-0@yopmail.com', password: 'password-0' },
}

const ENV_ENTRY_PATHS: Record<AllBCEnvironments, string> = {
  [Environment.BC]: '/login',
  [Environment.FORMATION_BC]: '/formation-bc',
  [Environment.CUT]: '/count',
  [Environment.TILT]: '/tilt',
  [Environment.CLICKSON]: '/clickson',
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

Cypress.Commands.add('loginForEnv', (env: AllBCEnvironments, email?: string, password?: string) => {
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
