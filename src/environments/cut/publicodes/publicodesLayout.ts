import { simpleLayout, tableLayout } from '@publicodes/forms'
import { CutRuleName } from './types'

export const DECHETS_EXCEPTIONNELS = [
  simpleLayout<CutRuleName>('déchets . exceptionnels . lampe xenon . nombre'),
  simpleLayout<CutRuleName>('déchets . exceptionnels . matériel technique . quantité'),
]

export const DECHETS_ORDINAIRES = tableLayout<CutRuleName>(
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
