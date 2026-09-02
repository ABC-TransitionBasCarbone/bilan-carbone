import '../../../../packages/types/cypress-commands'

declare global {
  namespace Cypress {
    interface Chainable {
      loginForEnv(env: 'bc' | 'cut' | 'tilt' | 'clickson', email?: string, password?: string): Chainable<void>
      signupCut(email?: string, cncOrSiret?: string): Chainable<void>
      waitForStable(): Chainable<void>
    }
  }
}
