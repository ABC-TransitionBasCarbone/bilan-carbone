import { getOrCreateEngine } from '@/lib/publicodes/singletons'
// PERF: for now we always load publicodes rules for each simplified
// environment as they are quite small (<100k unzip) and avoid propagating
// async code all over the app. If they grow significantly in the future, or
// there is more environments, we might want to lazy load them instead.
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
      strict: {
        // NOTE: for now, we disable strict mode to allow setting situations
        // that not fit the current model. Howerver, if the model changes,
        // migration for situations should be implemented.
        situation: false,
      },
    })
  })
}
