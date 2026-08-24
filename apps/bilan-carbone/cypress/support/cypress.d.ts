import '../../../../packages/types/cypress-commands'

declare namespace Cypress {
  interface Chainable {
    loginForEnv(env: 'bc' | 'cut' | 'tilt' | 'clickson', email?: string, password?: string): Chainable<void>
    signupCut(string?: string, string?: string): Chainable<void>
    waitForStable(): Chainable<void>
  }
}
