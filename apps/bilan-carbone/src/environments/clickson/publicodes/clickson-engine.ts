import { getOrCreateEngine } from '@/lib/publicodes/singletons'
// PERF: for now we always load publicodes rules for each simplified
// environment as they are quite small (<100k unzip) and avoid propagating
// async code all over the app. If they grow significantly in the future, or
// there is more environments, we might want to lazy load them instead.
import rules from '@abc-transitionbascarbone/publicodes-clickson'
import Engine from 'publicodes'
import { ClicksonPublicodesEngine } from './types'

/**
 * Returns a singleton instance of the Publicodes {@link Engine} configured
 * with CLICKSON specific rules.
 */
export function getClicksonEngine(): ClicksonPublicodesEngine {
  return getOrCreateEngine('CLICKSON', () => {
    return new Engine(rules, {
      flag: {
        // option required by @publicodes/forms.
        filterNotApplicablePossibilities: true,
      },
      strict: {
        // NOTE: for now, we disable strict mode to allow setting situations
        // that not fit the current model. Howerver, if the model changes,
        // migration for situations should be implemented.
        situation: false,
      },
    })
  })
}
