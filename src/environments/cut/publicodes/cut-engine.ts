import { getOrCreateEngine, getOrCreateFormBuilder } from '@/lib/publicodes/singletons'
import { isInNamespace } from '@/lib/publicodes/utils'
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
  return getOrCreateFormBuilder('CUT', () => {
    // TODO: implement a custom page builder to manage complex layouts
    return new FormBuilder<CutRuleName>({ engine: getCutEngine(), pageBuilder: cutPageBuilder })
  })
}

function cutPageBuilder(rules: CutRuleName[]): FormPages<FormLayout<CutRuleName>> {
  return [
    rules.reduce(
      (acc: { elements: Array<FormLayout<CutRuleName>> }, rule) => {
        if (isInNamespace<CutRuleName>(rule, 'déchets . ordinaires')) {
          return { title: 'déchets . ordinaires', elements: [DECHETS_ORDINAIRES_TABLE] }
        }
        if (isInNamespace<CutRuleName>(rule, 'mobilité spectateurs')) {
          return { title: 'mobilité spectateurs', elements: MOBILITE_SPECTATEURS_LAYOUT }
        }
        if (isInNamespace<CutRuleName>(rule, 'confiseries et boissons . fret')) {
          return { title: rule, elements: [simpleLayout(rule)] }
        }
        if (isInNamespace<CutRuleName>(rule, 'confiseries et boissons . électroménager')) {
          return { title: rule, elements: CONFISERIES_ET_BOISSONS_ELECTROMENAGER }
        }
        if (isInNamespace<CutRuleName>(rule, 'billetterie et communication . matériel distributeurs')) {
          return {
            title: 'billetterie et communication . matériel distributeurs',
            elements: BILLETTERIE_ET_COMMUNICATION_MATERIEL_DISTRIBUTEUR,
          }
        }
        if (isInNamespace<CutRuleName>(rule, 'billetterie et communication . matériel cinéma')) {
          return {
            title: 'billetterie et communication . matériel cinéma',
            elements: BILLETTERIE_ET_COMMUNICATION_MATERIEL_CINEMA,
          }
        }
        acc.elements.push(simpleLayout<CutRuleName>(rule))
        return acc
      },
      { elements: [] },
    ),
  ]
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

const MOBILITE_SPECTATEURS_LAYOUT = [
  simpleLayout<CutRuleName>('mobilité spectateurs . précision'),
  tableLayout<CutRuleName>(
    "Si vous avez réalisé une enquête, quelles sont les distances parcourues au total sur l'année pour chacun des modes de transport suivants :",
    ['Moyen de transport', 'Distance (km)'],
    [
      [
        'mobilité spectateurs . résultat précis . empreinte . RER et transilien',
        'mobilité spectateurs . résultat précis . empreinte . RER et transilien . distance',
      ],
      [
        'mobilité spectateurs . résultat précis . empreinte . métro ou tram',
        'mobilité spectateurs . résultat précis . empreinte . métro ou tram . distance',
      ],
      [
        'mobilité spectateurs . résultat précis . empreinte . bus',
        'mobilité spectateurs . résultat précis . empreinte . bus . distance',
      ],
      [
        'mobilité spectateurs . résultat précis . empreinte . vélo électrique',
        'mobilité spectateurs . résultat précis . empreinte . vélo électrique . distance',
      ],
      [
        'mobilité spectateurs . résultat précis . empreinte . vélo classique',
        'mobilité spectateurs . résultat précis . empreinte . vélo classique . distance',
      ],
      [
        'mobilité spectateurs . résultat précis . empreinte . marche',
        'mobilité spectateurs . résultat précis . empreinte . marche . distance',
      ],
      [
        'mobilité spectateurs . résultat précis . empreinte . voiture diesel',
        'mobilité spectateurs . résultat précis . empreinte . voiture diesel . distance',
      ],
      [
        'mobilité spectateurs . résultat précis . empreinte . voiture essence',
        'mobilité spectateurs . résultat précis . empreinte . voiture essence . distance',
      ],
      [
        'mobilité spectateurs . résultat précis . empreinte . voiture hybride',
        'mobilité spectateurs . résultat précis . empreinte . voiture hybride . distance',
      ],
      [
        'mobilité spectateurs . résultat précis . empreinte . voiture électrique',
        'mobilité spectateurs . résultat précis . empreinte . voiture électrique . distance',
      ],
      [
        'mobilité spectateurs . résultat précis . empreinte . moto',
        'mobilité spectateurs . résultat précis . empreinte . moto . distance',
      ],
      [
        'mobilité spectateurs . résultat précis . empreinte . scooter',
        'mobilité spectateurs . résultat précis . empreinte . scooter . distance',
      ],
      [
        'mobilité spectateurs . résultat précis . empreinte . trottinette électrique',
        'mobilité spectateurs . résultat précis . empreinte . trottinette électrique . distance',
      ],
    ],
  ),
  simpleLayout<CutRuleName>('mobilité spectateurs . mobilité spectateurs . contact'),
  simpleLayout<CutRuleName>('mobilité spectateurs . résultat estimé . profil établissement'),
  simpleLayout<CutRuleName>('mobilité spectateurs . résultat estimé . proximité spectateurs'),
  simpleLayout<CutRuleName>('mobilité spectateurs . résultat estimé . proximité spectateurs'),
]

const BILLETTERIE_ET_COMMUNICATION_MATERIEL_DISTRIBUTEUR = [
  tableLayout<CutRuleName>(
    'Quelle quantité de matériel distributeurs recevez-vous en moyenne par semaine ?',
    ['Type de matériel', 'Quantité'],
    [
      [
        'billetterie et communication . matériel distributeurs . affiches . affiches 120x160',
        'billetterie et communication . matériel distributeurs . affiches . affiches 120x160 . nombre',
      ],
      [
        'billetterie et communication . matériel distributeurs . affiches . affiches 40x60',
        'billetterie et communication . matériel distributeurs . affiches . affiches 40x60 . nombre',
      ],
    ],
  ),
  tableLayout<CutRuleName>(
    'Quelle quantité de matériel distributeurs recevez-vous en moyenne par mois ?',
    ['Type de matériel', 'Quantité'],
    [
      [
        'billetterie et communication . matériel distributeurs . PLV . PLV comptoir',
        'billetterie et communication . matériel distributeurs . PLV . PLV comptoir . nombre',
      ],
      [
        'billetterie et communication . matériel distributeurs . PLV . PLV grand format',
        'billetterie et communication . matériel distributeurs . PLV . PLV grand format . nombre',
      ],
    ],
  ),
]

const BILLETTERIE_ET_COMMUNICATION_MATERIEL_CINEMA = [
  tableLayout<CutRuleName>(
    'Quelle quantité de matériel produisez-vous chaque mois ?',
    ['Type de matériel', 'Quantité'],
    [
      [
        'billetterie et communication . matériel cinéma . production . programme',
        'billetterie et communication . matériel cinéma . production . programme . nombre',
      ],
      [
        'billetterie et communication . matériel cinéma . production . affiches',
        'billetterie et communication . matériel cinéma . production . affiches . nombre',
      ],
      [
        'billetterie et communication . matériel cinéma . production . flyers',
        'billetterie et communication . matériel cinéma . production . flyers . nombre',
      ],
    ],
  ),
]

const CONFISERIES_ET_BOISSONS_ELECTROMENAGER = [
  tableLayout<CutRuleName>(
    "Pour les différents équipements informatiques utilisés, veuillez indiquer leur nombre et leur date d'achat ou durée de location :",
    ["Type d'électroménager", 'Nombre', "Date d'achat", "Durée de location (à l'année)"],
    [
      [
        'confiseries et boissons . électroménager . réfrigérateurs',
        'confiseries et boissons . électroménager . réfrigérateurs . nombre',
        'confiseries et boissons . électroménager . réfrigérateurs . année achat',
        'confiseries et boissons . électroménager . réfrigérateurs . durée location',
      ],
      [
        'confiseries et boissons . électroménager . congélateurs',
        'confiseries et boissons . électroménager . congélateurs . nombre',
        'confiseries et boissons . électroménager . congélateurs . année achat',
        'confiseries et boissons . électroménager . congélateurs . durée location',
      ],
      [
        'confiseries et boissons . électroménager . warmers',
        'confiseries et boissons . électroménager . warmers . nombre',
        'confiseries et boissons . électroménager . warmers . année achat',
        'confiseries et boissons . électroménager . warmers . durée location',
      ],
      [
        'confiseries et boissons . électroménager . distributeurs',
        'confiseries et boissons . électroménager . distributeurs . nombre',
        'confiseries et boissons . électroménager . distributeurs . année achat',
        'confiseries et boissons . électroménager . distributeurs . durée location',
      ],
    ],
  ),
]
