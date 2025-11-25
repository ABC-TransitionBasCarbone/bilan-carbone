import { FormLayout, TableFormLayout } from '@/components/publicodes-form/formLayout/formLayout'
import { getOrCreateEngine, getOrCreateFormBuilder } from '@/lib/publicodes/singletons'
import { isInNamespace } from '@/lib/publicodes/utils'
import rules from '@abc-transitionbascarbone/publicodes-count'
import { FormBuilder, FormPages, groupByNamespace } from '@publicodes/forms'
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
  const pageBuilder = cutPageBuilder

  return getOrCreateFormBuilder('CUT', () => {
    return new FormBuilder<CutRuleName>({ engine, pageBuilder })
  })
}

export function cutPageBuilder(fields: FormLayout<CutRuleName>[]): FormPages<FormLayout<CutRuleName>> {
  const groupedByNamespace = groupByNamespace<CutRuleName>(fields as CutRuleName[])
  return groupedByNamespace.map(({ title, elements }) => {
    if (isInNamespace<CutRuleName>(title as CutRuleName, 'déchets . ordinaires')) {
      return { title, elements: [DECHETS_ORDINAIRES_TABLE] }
    }
    return { title, elements }
  })
}

const DECHETS_ORDINAIRES_TABLE: TableFormLayout<CutRuleName> = {
  title: 'Renseignez ici les quantités de déchets générés chaque semaine',
  headers: ['Nombre de bennes', 'Taille des bennes', 'Fréquence de ramassage (par semaine)'],
  rows: [
    [
      'déchets . ordinaires . ordures ménagères . nb bennes',
      'déchets . ordinaires . ordures ménagères . taille benne',
      'déchets . ordinaires . ordures ménagères . fréquence ramassage',
    ],
    [
      'déchets . ordinaires . emballages et papier . nb bennes',
      'déchets . ordinaires . emballages et papier . taille benne',
      'déchets . ordinaires . emballages et papier . fréquence ramassage',
    ],
    [
      'déchets . ordinaires . biodéchets . nb bennes',
      'déchets . ordinaires . biodéchets . taille benne',
      'déchets . ordinaires . biodéchets . fréquence ramassage',
    ],
    [
      'déchets . ordinaires . verre . nb bennes',
      'déchets . ordinaires . verre . taille benne',
      'déchets . ordinaires . verre . fréquence ramassage',
    ],
  ],
}
