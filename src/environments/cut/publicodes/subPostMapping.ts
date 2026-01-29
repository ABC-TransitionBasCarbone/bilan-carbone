import {
  FormLayout,
  groupLayout,
  inputLayout,
  listLayout,
  tableLayout,
} from '@/components/publicodes-form/layouts/formLayout'
import { CutPost } from '@/services/posts.enums'
import { SubPost } from '@prisma/client'
import { CutRuleName } from './types'

export const getPostRuleNameCut = (post: CutPost): CutRuleName => {
  return POST_TO_RULENAME[post]
}

export const getSubPostRuleNameCut = (subPost: SubPost): CutRuleName | undefined => {
  return SUBPOST_TO_RULENAME[subPost]
}

export const hasPublicodesMapping = (subPost: SubPost): boolean => {
  return SUBPOST_TO_RULENAME[subPost] !== undefined
}

export const getFormLayoutsForSubPostCUT = (subPost: SubPost): FormLayout<CutRuleName>[] => {
  return SUBPOST_TO_FORM_LAYOUTS[subPost] || []
}

const POST_TO_RULENAME: Record<CutPost, CutRuleName> = {
  [CutPost.Fonctionnement]: 'fonctionnement',
  [CutPost.MobiliteSpectateurs]: 'mobilité spectateurs',
  [CutPost.TourneesAvantPremieres]: 'tournées avant premières',
  [CutPost.SallesEtCabines]: 'salles et cabines',
  [CutPost.ConfiseriesEtBoissons]: 'confiseries et boissons',
  [CutPost.Dechets]: 'déchets',
  [CutPost.BilletterieEtCommunication]: 'billetterie et communication',
} as const

const SUBPOST_TO_RULENAME: Partial<Record<SubPost, CutRuleName>> = {
  Batiment: 'fonctionnement . bâtiment',
  Equipe: 'fonctionnement . équipe',
  Energie: 'fonctionnement . énergie',
  ActivitesDeBureau: 'fonctionnement . activités de bureau',
  MobiliteSpectateurs: 'mobilité spectateurs . mobilité spectateurs',
  EquipesRecues: 'tournées avant premières . équipes reçues',
  MaterielTechnique: 'salles et cabines . matériel technique',
  AutreMateriel: 'salles et cabines . autre matériel',
  Achats: 'confiseries et boissons . achats',
  Fret: 'confiseries et boissons . fret',
  Electromenager: 'confiseries et boissons . électroménager',
  DechetsOrdinaires: 'déchets . ordinaires',
  DechetsExceptionnels: 'déchets . exceptionnels',
  MaterielDistributeurs: 'billetterie et communication . matériel distributeurs',
  MaterielCinema: 'billetterie et communication . matériel cinéma',
  CommunicationDigitale: 'billetterie et communication . communication digitale',
  CaissesEtBornes: 'billetterie et communication . caisses et bornes',
} as const

const input = (rule: CutRuleName): FormLayout<CutRuleName> => inputLayout<CutRuleName>(rule)
const group = (title: string, rules: CutRuleName[]): FormLayout<CutRuleName> => groupLayout<CutRuleName>(title, rules)
const table = (title: string, headers: string[], rows: CutRuleName[][]): FormLayout<CutRuleName> =>
  tableLayout<CutRuleName>(title, headers, rows)
const list = (
  title: string,
  headers: string[],
  targetRule: CutRuleName,
  rules: CutRuleName[],
): FormLayout<CutRuleName> => listLayout<CutRuleName>(title, headers, targetRule, rules)

export const SUBPOST_TO_FORM_LAYOUTS: Partial<Record<SubPost, FormLayout<CutRuleName>[]>> = {
  Batiment: [
    input('fonctionnement . bâtiment . construction . surface'),
    input('fonctionnement . bâtiment . construction . année de construction'),
    group('BatimentRenovation.question', [
      'fonctionnement . bâtiment . rénovation . type . rénovation totale',
      'fonctionnement . bâtiment . rénovation . type . extension',
      'fonctionnement . bâtiment . rénovation . type . autres travaux importants',
      'fonctionnement . bâtiment . rénovation . type . aucun',
    ]),
    input('fonctionnement . bâtiment . rénovation . empreinte travaux . montant'),
    input('fonctionnement . bâtiment . rénovation . empreinte extension . surface'),
    input('fonctionnement . bâtiment . est partagé'),
    input('fonctionnement . bâtiment . autre activité . surface'),
    input('fonctionnement . bâtiment . parking présent'),
    input('fonctionnement . bâtiment . parking . nombre de places'),
  ],
  Equipe: [
    list(
      'Equipe.question',
      ['Equipe.libelle', 'Equipe.nbJours', 'Equipe.moyenTransport', 'Equipe.distance'],
      'fonctionnement . équipe . collaborateurs',
      [
        'fonctionnement . équipe . collaborateur type . libellé',
        'fonctionnement . équipe . collaborateur type . nombre de jours par semaine',
        'fonctionnement . équipe . collaborateur type . transport . moyen de transport',
        'fonctionnement . équipe . collaborateur type . transport . distance',
      ],
    ),
  ],
  Energie: [
    input('fonctionnement . énergie . électricité . consommation'),
    input('fonctionnement . énergie . gaz . consommation'),
    input('fonctionnement . énergie . fioul . consommation'),
    input('fonctionnement . énergie . réseau de chaleur . consommation'),
    input('fonctionnement . énergie . réseau de froid . consommation'),
    input('fonctionnement . énergie . granulés . consommation'),
    input('fonctionnement . énergie . est équipé climatisation'),
    input('fonctionnement . énergie . groupes électrogènes'),
    input('fonctionnement . énergie . groupes électrogènes . consommation'),
  ],
  ActivitesDeBureau: [
    input('fonctionnement . activités de bureau . petites fournitures . montant'),
    input('fonctionnement . activités de bureau . services . montant'),
    list(
      'ActivitesDeBureauEquipementInformatique.question',
      [
        'ActivitesDeBureauEquipementInformatique.type',
        'ActivitesDeBureauEquipementInformatique.dateAchat',
        'ActivitesDeBureauEquipementInformatique.duree',
        'ActivitesDeBureauEquipementInformatique.nombre',
      ],
      'fonctionnement . activités de bureau . informatique',
      [
        'fonctionnement . activités de bureau . informatique . équipement',
        'fonctionnement . activités de bureau . informatique . appareil . année achat',
        'fonctionnement . activités de bureau . informatique . appareil . durée location',
        'fonctionnement . activités de bureau . informatique . appareil . nombre',
      ],
    ),
  ],
  MobiliteSpectateurs: [
    input('mobilité spectateurs . précision'),
    table(
      'MobiliteSpectateurs.question',
      ['MobiliteSpectateurs.moyenTransport', 'MobiliteSpectateurs.distance'],
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
    input('mobilité spectateurs . mobilité spectateurs . contact'),
    input('mobilité spectateurs . résultat estimé . profil établissement'),
    input('mobilité spectateurs . résultat estimé . proximité spectateurs'),
  ],
  EquipesRecues: [input('tournées avant premières . équipes reçues . nombre équipes')],
  MaterielTechnique: [
    list(
      'MaterielTechniqueEquipement.question',
      [
        'MaterielTechniqueEquipement.nom',
        'MaterielTechniqueEquipement.projecteurs',
        'MaterielTechniqueEquipement.anneeAchatProjecteur',
        'MaterielTechniqueEquipement.ecran',
        'MaterielTechniqueEquipement.surfaceEcran',
        'MaterielTechniqueEquipement.anneeAchatEcran',
        'MaterielTechniqueEquipement.fauteuils',
        'MaterielTechniqueEquipement.nbFauteuils',
        'MaterielTechniqueEquipement.anneeAchatFauteuils',
        'MaterielTechniqueEquipement.systemeSon',
        'MaterielTechniqueEquipement.anneeAchatSystemeSon',
      ],
      'salles et cabines . matériel technique . salles',
      [
        'salles et cabines . matériel technique . salle . nom',
        'salles et cabines . matériel technique . salle . projecteur . type',
        'salles et cabines . matériel technique . salle . projecteur . année achat',
        'salles et cabines . matériel technique . salle . écran . type',
        'salles et cabines . matériel technique . salle . écran . surface écran',
        'salles et cabines . matériel technique . salle . écran . année achat',
        'salles et cabines . matériel technique . salle . fauteuils . type',
        'salles et cabines . matériel technique . salle . fauteuils . nombre',
        'salles et cabines . matériel technique . salle . fauteuils . année achat',
        'salles et cabines . matériel technique . salle . système son . type',
        'salles et cabines . matériel technique . salle . système son . année achat',
      ],
    ),
    input('salles et cabines . matériel technique . films . nombre films dématérialisés'),
    input('salles et cabines . matériel technique . cloud . stockage'),
    input('salles et cabines . matériel technique . disques durs . nombre'),
  ],
  AutreMateriel: [input('salles et cabines . autre matériel . lunettes 3D . nombre')],
  Achats: [
    input('confiseries et boissons . achats . vente sur place'),
    input('confiseries et boissons . achats . achat type'),
  ],
  Fret: [input('confiseries et boissons . fret . distance')],
  Electromenager: [
    table(
      'Electromenager.question',
      [
        'Electromenager.typeEquipement',
        'Electromenager.nombre',
        'Electromenager.dateAchat',
        'Electromenager.dureeLocation',
      ],
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
  ],
  DechetsOrdinaires: [
    table(
      'DechetsOrdinaires.question',
      [
        'DechetsOrdinaires.typeDechet',
        'DechetsOrdinaires.nbBennes',
        'DechetsOrdinaires.tailleBennes',
        'DechetsOrdinaires.frequenceRamassage',
      ],
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
    ),
  ],
  DechetsExceptionnels: [
    input('déchets . exceptionnels . lampe xenon . nombre'),
    input('déchets . exceptionnels . matériel technique . quantité'),
  ],
  MaterielDistributeurs: [
    table(
      'MaterielDistributeursAffiches.question',
      ['MaterielDistributeursAffiches.typeMateriel', 'MaterielDistributeursAffiches.quantite'],
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
    table(
      'MaterielDistributeursPLV.question',
      ['MaterielDistributeursPLV.typeMateriel', 'MaterielDistributeursPLV.quantite'],
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
  ],
  MaterielCinema: [
    table(
      'MaterielCinema.question',
      ['MaterielCinema.typeMateriel', 'MaterielCinema.quantite'],
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
  ],
  CommunicationDigitale: [
    input('billetterie et communication . communication digitale . newsletters . nombre'),
    input('billetterie et communication . communication digitale . newsletters . destinataires'),
    input('billetterie et communication . communication digitale . affichage dynamique . nombre'),
    input('billetterie et communication . communication digitale . écrans . nombre'),
    input('billetterie et communication . communication digitale . affichage extérieur . surface'),
  ],
  CaissesEtBornes: [
    input('billetterie et communication . caisses et bornes . caisses libre service . nombre'),
    input('billetterie et communication . caisses et bornes . caisse classique . nombre'),
  ],
} as const
