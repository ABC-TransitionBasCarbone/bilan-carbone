import { getOrCreateEngine } from '@/lib/publicodes/singletons'
// PERF: for now we always load publicodes rules for each simplified
// environment as they are quite small (<100k unzip) and avoid propagating
// async code all over the app. If they grow significantly in the future, or
// there is more environments, we might want to lazy load them instead.
import rules from '@abc-transitionbascarbone/publicodes-tilt'
import Engine from 'publicodes'
import { TiltPublicodesEngine } from './types'

/**
 * Returns a singleton instance of the Publicodes {@link Engine} configured
 * with TILT specific rules.
 */
export function getTiltEngine(): TiltPublicodesEngine {
  return getOrCreateEngine('TILT', () => {
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
