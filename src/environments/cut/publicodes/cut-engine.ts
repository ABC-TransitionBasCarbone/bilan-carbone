import { getOrCreateEngine } from '@/lib/publicodes/singletons'
import Engine from 'publicodes'
import { CutPublicodesEngine } from './types'

/**
 * Returns a singleton instance of the Publicodes {@link Engine} configured
 * with CUT specific rules.
 */
export function getCutEngine(): CutPublicodesEngine {
  return getOrCreateEngine('CUT', () => {
    const rules = require('@abc-transitionbascarbone/publicodes-count').default
    console.log('rule')
    return new Engine(rules, {
      flag: {
        // option required by @publicodes/forms.
        filterNotApplicablePossibilities: true,
      },
    })
  })
}
