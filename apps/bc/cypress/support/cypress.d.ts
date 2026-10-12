import { AllBCEnvironments } from '@abc-transitionbascarbone/common/utils/types'
import '../../../../packages/common/types/cypress-commands'

declare global {
  namespace Cypress {
    interface Chainable {
      loginForEnv(env: AllBCEnvironments, email?: string, password?: string): Chainable<void>
      signupCut(email?: string, cncOrSiret?: string): Chainable<void>
      waitForStable(): Chainable<void>
    }
  }
}
