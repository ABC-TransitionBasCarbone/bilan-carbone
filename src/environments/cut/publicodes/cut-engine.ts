import { getOrCreateEngine, getOrCreateFormBuilder } from '@/lib/publicodes/singletons'
import { isInNamespace as isInNamespaceGeneric } from '@/lib/publicodes/utils'
import rules from '@abc-transitionbascarbone/publicodes-count'
import { FormBuilder, FormLayout, FormPages, simpleLayout, tableLayout } from '@publicodes/forms'
import Engine, { utils } from 'publicodes'
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
    return [{ title, elements: [DECHETS_ORDINAIRES_TABLE] }]
  }

  return [{ title, elements: rules.map(simpleLayout) }]
}

const DECHETS_ORDINAIRES_TABLE = tableLayout<CutRuleName>(
  'Renseignez ici les quantités de déchets générés chaque semaine',
  ['Type de déchets', 'Nombre de bennes', 'Taille des bennes', 'Fréquence de ramassage (par semaine)'],
  [
    [
      'déchets . ordinaires . ordures ménagères',
      'déchets . ordinaires . ordures ménagères . nombre bennes',
      'déchets . ordinaires . ordures ménagères . taille benne',
      'déchets . ordinaires . ordures ménagères . fréquence ramassage',
    ],
    [
      'déchets . ordinaires . emballages et papier',
      'déchets . ordinaires . emballages et papier . nombre bennes',
      'déchets . ordinaires . emballages et papier . taille benne',
      'déchets . ordinaires . emballages et papier . fréquence ramassage',
    ],
    [
      'déchets . ordinaires . biodéchets',
      'déchets . ordinaires . biodéchets . nombre bennes',
      'déchets . ordinaires . biodéchets . taille benne',
      'déchets . ordinaires . biodéchets . fréquence ramassage',
    ],
    [
      'déchets . ordinaires . verre',
      'déchets . ordinaires . verre . nombre bennes',
      'déchets . ordinaires . verre . taille benne',
      'déchets . ordinaires . verre . fréquence ramassage',
    ],
  ],
)
