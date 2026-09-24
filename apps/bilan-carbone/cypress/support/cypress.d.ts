import { Environment } from '@abc-transitionbascarbone/db-common/enums'
import '../../../../packages/types/cypress-commands'

declare global {
  namespace Cypress {
    interface Chainable {
      loginForEnv(env: Environment, email?: string, password?: string): Chainable<void>
      signupCut(email?: string, cncOrSiret?: string): Chainable<void>
      waitForStable(): Chainable<void>
    }
  }
}
