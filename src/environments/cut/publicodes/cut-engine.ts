import { getOrCreateEngine, getOrCreateFormBuilder } from '@/lib/publicodes/singletons'
import rules from '@abc-transitionbascarbone/publicodes-count'
import { FormBuilder, FormLayout, FormPages, simpleLayout, tableLayout } from '@publicodes/forms'
import Engine from 'publicodes'
import { CutPublicodesEngine, CutRuleName } from './types'

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

export function getCutFormBuilder(): FormBuilder<CutRuleName> {
  const engine = getCutEngine()

  return getOrCreateFormBuilder('CUT', () => {
    // TODO: implement a custom page builder to manage complex layouts
    return new FormBuilder<CutRuleName>({ engine })
  })
}
