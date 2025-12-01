import { getOrCreateEngine, getOrCreateFormBuilder } from '@/lib/publicodes/singletons'
import { isInNamespace as isInNamespaceGeneric } from '@/lib/publicodes/utils'
import rules from '@abc-transitionbascarbone/publicodes-count'
import { FormBuilder, FormLayout, FormPages, simpleLayout } from '@publicodes/forms'
import Engine, { utils } from 'publicodes'
import { DECHETS_EXCEPTIONNELS, DECHETS_ORDINAIRES } from './publicodesLayout'
import { CutPublicodesEngine, CutRuleName } from './types'

function isInNamespace(namespace: CutRuleName, rule: string | undefined): boolean {
  return rule ? isInNamespaceGeneric<CutRuleName>(rule as CutRuleName, namespace) : false
}

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
  return getOrCreateFormBuilder('CUT', () => {
    // TODO: implement a custom page builder to manage complex layouts
    return new FormBuilder<CutRuleName>({ engine: getCutEngine(), pageBuilder: cutPageBuilder })
  })
}

function cutPageBuilder(rules: CutRuleName[]): FormPages<FormLayout<CutRuleName>> {
  const title =
    rules.length === 0
      ? undefined
      : rules.length === 1
        ? rules[0]
        : rules.reduce((acc, rule) => utils.findCommonAncestor(acc, rule) as CutRuleName, rules[0])

  if (rules.some((rule) => isInNamespace('déchets . ordinaires', rule))) {
    return [{ title, elements: [DECHETS_ORDINAIRES] }]
  }

  if (rules.some((rule) => isInNamespace('déchets . exceptionnels', rule))) {
    return [{ title, elements: DECHETS_EXCEPTIONNELS }]
  }

  return [{ title, elements: rules.map(simpleLayout) }]
}
