import { getOrCreateEngine } from '@/lib/publicodes/singletons'
import Engine from 'publicodes'
import { ClicksonPublicodesEngine } from './types'

/**
 * Returns a singleton instance of the Publicodes {@link Engine} configured
 * with CLICKSON specific rules.
 */
export function getClicksonEngine(): ClicksonPublicodesEngine {
  return getOrCreateEngine('CLICKSON', () => {
    const rules = require('@abc-transitionbascarbone/publicodes-clickson').default
    return new Engine(rules, {
      flag: {
        // option required by @publicodes/forms.
        filterNotApplicablePossibilities: true,
      },
    })
  })
}
