import { getOrCreateEngine, getOrCreateFormBuilder } from '@/lib/publicodes/singletons'
import { isInNamespace } from '@/lib/publicodes/utils'
import rules from '@abc-transitionbascarbone/publicodes-count'
import { FormBuilder, FormLayout, FormPages, groupByNamespace, tableLayout } from '@publicodes/forms'
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
  return getOrCreateFormBuilder('CUT', () => {
    // TODO: implement a custom page builder to manage complex layouts
    return new FormBuilder<CutRuleName>({ engine: getCutEngine(), pageBuilder: cutPageBuilder })
  })
}

function cutPageBuilder(rules: CutRuleName[]): FormPages<FormLayout<CutRuleName>> {
  const groupedRules = groupByNamespace(rules)
  return groupedRules.map(({ title, elements }) => {
    if (isInNamespace<CutRuleName>(title as CutRuleName, 'déchets . ordinaires')) {
      return { title, elements: [DECHETS_ORDINAIRES_TABLE] }
    }
    return { title, elements }
  })
}

const DECHETS_ORDINAIRES_TABLE = tableLayout<CutRuleName>(
  'Renseignez ici les quantités de déchets générés chaque semaine',
  ['Nombre de bennes', 'Taille des bennes', 'Fréquence de ramassage (par semaine)'],
  [
    [
      'déchets . ordinaires . ordures ménagères . nombre bennes',
      'déchets . ordinaires . ordures ménagères . taille benne',
      'déchets . ordinaires . ordures ménagères . fréquence ramassage',
    ],
    [
      'déchets . ordinaires . emballages et papier . nombre bennes',
      'déchets . ordinaires . emballages et papier . taille benne',
      'déchets . ordinaires . emballages et papier . fréquence ramassage',
    ],
    [
      'déchets . ordinaires . biodéchets . nombre bennes',
      'déchets . ordinaires . biodéchets . taille benne',
      'déchets . ordinaires . biodéchets . fréquence ramassage',
    ],
    [
      'déchets . ordinaires . verre . nombre bennes',
      'déchets . ordinaires . verre . taille benne',
      'déchets . ordinaires . verre . fréquence ramassage',
    ],
  ],
)
