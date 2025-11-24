import { getOrCreateEngine } from '@/lib/publicodes/engine'
import rules from '@abc-transitionbascarbone/publicodes-count'
import Engine from 'publicodes'
import { CutPublicodesEngine } from './types'

/**
 * Returns a singleton instance of the Publicodes {@link Engine} configured
 * with CUT specific rules.
 */
export function getCutEngine(): CutPublicodesEngine {
  return getOrCreateEngine('CUT', () => {
    return new Engine(rules, {
      flag: {
        // option required by @publicodes/forms.
        filterNotApplicablePossibilities: true,
      },
    })
  })
}
