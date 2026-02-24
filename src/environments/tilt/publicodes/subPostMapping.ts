import {
  FormLayout,
  groupLayout,
  inputLayout,
  listLayout,
  tableLayout,
} from '@/components/publicodes-form/layouts/formLayout'
import { TiltPost } from '@/services/posts.enums'
import { SubPost } from '@prisma/client'
import { TiltRuleName } from './types'

export const getPostRuleNameTilt = (post: TiltPost): TiltRuleName | '' => {
  return POST_TO_RULENAME[post] ?? ''
}

export const getSubPostRuleNameTilt = (subPost: SubPost): TiltRuleName | undefined => {
  return SUBPOST_TO_RULENAME[subPost]
}

export const hasPublicodesMapping = (subPost: SubPost): boolean => {
  return SUBPOST_TO_RULENAME[subPost] !== undefined
}

export const getFormLayoutsForSubPostTILT = (subPost: SubPost): FormLayout<TiltRuleName>[] => {
  return SUBPOST_TO_FORM_LAYOUTS[subPost] || []
}

const POST_TO_RULENAME: Partial<Record<TiltPost, TiltRuleName>> = {
  [TiltPost.ConstructionDesLocaux]: 'construction',
  [TiltPost.Energies]: 'énergie',
  [TiltPost.DechetsDirects]: 'déchets',
  [TiltPost.FroidEtClim]: 'froid et clim',
  [TiltPost.DeplacementsDePersonne]: 'déplacements',
  [TiltPost.TransportDeMarchandises]: 'fret . transport',
  [TiltPost.IntrantsBiensEtMatieresTilt]: 'intrants-biens-et-matières',
  [TiltPost.Alimentation]: 'alimentation',
  [TiltPost.IntrantsServices]: 'intrants-services',
  [TiltPost.EquipementsEtImmobilisations]: 'équipements et immobilisations',
  [TiltPost.Utilisation]: 'utilisation',
  [TiltPost.FinDeVie]: 'fin de vie',
  // [TiltPost.Teletravail]: '',
} as const

const SUBPOST_TO_RULENAME: Partial<Record<SubPost, TiltRuleName>> = {
  Batiments: 'construction . bâtiment',
  AutresInfrastructures: 'construction . infrastructure',
  CombustiblesFossiles: 'énergie . fossiles',
  CombustiblesOrganiques: 'énergie . combustibles organiques',
  ReseauxDeChaleurEtDeVapeur: 'énergie . réseaux de chaleur',
  ReseauxDeFroid: 'énergie . réseaux de froid',
  Electricite: 'énergie . électricité',
  DechetsDEmballagesEtPlastiques: 'déchets . emballages et plastiques',
  DechetsOrganiques: 'déchets . organiques',
  DechetsOrduresMenageres: 'déchets . ordures ménagères',
  FroidEtClim: 'froid et clim',
  // EmissionsLieesAuChangementDAffectationDesSolsCas,
  DeplacementsDomicileTravailSalaries: 'déplacements . DT-salariés',
  DeplacementsDomicileTravailBenevoles: 'déplacements . DT-bénévoles',
  DeplacementsDansLeCadreDUneMissionAssociativeSalaries: 'déplacements . DM-salariés',
  DeplacementsDansLeCadreDUneMissionAssociativeBenevoles: 'déplacements . DM-bénévoles',
  DeplacementsDesBeneficiaires: 'déplacements . bénéficiaires',
  Entrant: 'fret . transport',
  // Interne: "fret . transport",
  // Sortant: "fret . transport",
  TransportFabricationDesVehicules: 'fret . fabrication',
  // MetauxPlastiquesEtVerre: "",
  PapiersCartons: 'intrants-biens-et-matières . papier-carton',
  // MateriauxDeConstruction: "",
  // ProduitsChimiquesEtHydrogene: "",
  // MatiereDestineeAuxEmballages: "",
  AutresIntrants: 'intrants-biens-et-matières . autres-produits-manufacturés',
  // BiensEtMatieresEnApprocheMonetaire,
  RepasPrisParLesSalaries: 'alimentation . salariés',
  RepasPrisParLesBenevoles: 'alimentation . bénévoles',
  RepasPrisParLesBeneficiaires: 'alimentation . bénéficiaires',
  UsagesNumeriques: 'intrants-services . numérique',
  ServicesEnApprocheMonetaire: 'intrants-services . services',
  EquipementsDesSalaries: 'équipements et immobilisations . infos',
  // ParcInformatiqueDesSalaries,
  // EquipementsDesBenevoles,
  // ParcInformatiqueDesBenevoles,
  UtilisationEnResponsabiliteConsommationDEnergie: 'utilisation . responsabilite conso energie',
  // InvestissementsFinanciersRealises,
  // ConsommationDEnergieEnFinDeVie,
  TraitementDesDechetsEnFinDeVie: 'fin de vie . déchets',
  // FuitesOuEmissionsNonEnergetiques,
  // TraitementDesEmballagesEnFinDeVie,
  // TeletravailSalaries,
  // TeletravailBenevoles,
} as const

const input = (rule: TiltRuleName): FormLayout<TiltRuleName> => inputLayout<TiltRuleName>(rule)
const group = (title: string, rules: TiltRuleName[]): FormLayout<TiltRuleName> =>
  groupLayout<TiltRuleName>(title, rules)
const table = (title: string, headers: string[], rows: TiltRuleName[][]): FormLayout<TiltRuleName> =>
  tableLayout<TiltRuleName>(title, headers, rows)
const list = (targetRule: TiltRuleName, rules: TiltRuleName[]): FormLayout<TiltRuleName> =>
  listLayout<TiltRuleName>(targetRule, rules)

export const SUBPOST_TO_FORM_LAYOUTS: Partial<Record<SubPost, FormLayout<TiltRuleName>[]>> = {
  Batiments: [
    input('construction . bâtiment . locaux'),
    input('construction . bâtiment . locaux . locaux seuls . surface'),
    input('construction . bâtiment . locaux . locaux partagés . surface'),
    input('construction . bâtiment . locaux . locaux partagés . pourcentage'),
  ],
  AutresInfrastructures: [
    input('construction . infrastructure . parking présent'),
    input('construction . infrastructure . nombre de places'),
  ],
  CombustiblesFossiles: [
    input('énergie . fossiles . gaz . consommation'),
    input('énergie . fossiles . fioul . consommation'),
  ],
  CombustiblesOrganiques: [
    input('énergie . combustibles organiques . bois . consommation'),
    input('énergie . combustibles organiques . granulés . consommation'),
  ],

  ReseauxDeChaleurEtDeVapeur: [input('énergie . réseaux de chaleur . consommation')],
  ReseauxDeFroid: [input('énergie . réseaux de froid . consommation')],
  Electricite: [
    input('énergie . électricité . consommation'),
    input('énergie . électricité . autoproduction . autoproduction'),
  ],
  DechetsOrganiques: [input('déchets . organiques . poids')],
  DechetsOrduresMenageres: [input('déchets . ordures ménagères . poids')],
  FroidEtClim: [
    input('froid et clim . nombre'),
    input('froid et clim . fuites . locaux partagés'),
    input('froid et clim . fuites . locaux seuls'),
  ],
  DechetsDEmballagesEtPlastiques: [
    input('déchets . emballages et plastiques . déchets verre . poids'),
    input('déchets . emballages et plastiques . poubelle jaune . poids'),
  ],
  TraitementDesDechetsEnFinDeVie: [
    input('fin de vie . déchets . fin de vie présente'),
    input('fin de vie . déchets . poids'),
  ],
  UtilisationEnResponsabiliteConsommationDEnergie: [
    input('utilisation . responsabilite conso energie . élec présente'),
    input('utilisation . responsabilite conso energie . élec . conso'),
    input('utilisation . responsabilite conso energie . fossiles présents'),
    input('utilisation . responsabilite conso energie . fioul . conso'),
    input('utilisation . responsabilite conso energie . essence . conso'),
    input('utilisation . responsabilite conso energie . gazole . conso'),
    input('utilisation . responsabilite conso energie . gaz naturel . conso'),
  ],
  EquipementsDesSalaries: [
    input('équipements et immobilisations . infos . ordinateurs fixes . quantité'),
    input('équipements et immobilisations . infos . ordinateurs portables . quantité'),
    input('équipements et immobilisations . infos . photocopieurs . quantité'),
    input('équipements et immobilisations . infos . imprimantes . quantité'),
    input('équipements et immobilisations . infos . téléphones fixes . quantité'),
    input('équipements et immobilisations . infos . téléphones portables . quantité'),
    input('équipements et immobilisations . infos . autres écrans . quantité'),
    input('équipements et immobilisations . infos . prise en compte reconditionné'),
  ],
  ServicesEnApprocheMonetaire: [
    table(
      'intrants-services.services',
      [
        'intrants-services.typeService',
        'intrants-services.montant-dépensé',
      ],
      [
        [
          'intrants-services . services . spectacles-musées',
          'intrants-services . services . spectacles-musées . montant-dépensé',
        ],
        [
          'intrants-services . services . assurance-reassurance',
          'intrants-services . services . assurance-reassurance . montant-dépensé',
        ],
        [
          'intrants-services . services . telecom',
          'intrants-services . services . telecom . montant-dépensé',
        ],
        [
          'intrants-services . services . sante-humaine',
          'intrants-services . services . sante-humaine . montant-dépensé',
        ],
        [
          'intrants-services . services . edition',
          'intrants-services . services . edition . montant-dépensé',
        ],
        [
          'intrants-services . services . poste-courrier',
          'intrants-services . services . poste-courrier . montant-dépensé',
        ],
        [
          'intrants-services . services . restauration',
          'intrants-services . services . restauration . montant-dépensé',
        ],
        [
          'intrants-services . services . formation',
          'intrants-services . services . formation . montant-dépensé',
        ],
        [
          'intrants-services . services . reparation-installation',
          'intrants-services . services . reparation-installation . montant-dépensé',
        ],
        [
          'intrants-services . services . juridique-comptable',
          'intrants-services . services . juridique-comptable . montant-dépensé',
        ],
        [
          'intrants-services . services . programmation-conseil',
          'intrants-services . services . programmation-conseil . montant-dépensé',
        ],    
      ],
    ),
  ],
  UsagesNumeriques: [
    input('intrants-services . numérique . streaming . heures'),
    input('intrants-services . numérique . visioconférence . heures'),
    input('intrants-services . numérique . mails . nombre'),
    input('intrants-services . numérique . stockage-cloud . volume'),
  ],
  RepasPrisParLesBeneficiaires: [
    input('alimentation . bénéficiaires . repas présent'),
    input('alimentation . bénéficiaires . viande rouge . nombre de repas'),
    input('alimentation . bénéficiaires . viande blanche . nombre de repas'),
    input('alimentation . bénéficiaires . poisson blanc . nombre de repas'),
    input('alimentation . bénéficiaires . poisson gras . nombre de repas'),
    input('alimentation . bénéficiaires . végétarien . nombre de repas'),
    input('alimentation . bénéficiaires . végétalien . nombre de repas'),
  ],
  RepasPrisParLesBenevoles: [
    input('alimentation . bénévoles . viande rouge . nombre de repas'),
    input('alimentation . bénévoles . viande blanche . nombre de repas'),
    input('alimentation . bénévoles . poisson blanc . nombre de repas'),
    input('alimentation . bénévoles . poisson gras . nombre de repas'),
    input('alimentation . bénévoles . végétarien . nombre de repas'),
    input('alimentation . bénévoles . végétalien . nombre de repas'),
  ],
  RepasPrisParLesSalaries: [
    input('alimentation . salariés . viande rouge . nombre de repas'),
    input('alimentation . salariés . viande blanche . nombre de repas'),
    input('alimentation . salariés . poisson blanc . nombre de repas'),
    input('alimentation . salariés . poisson gras . nombre de repas'),
    input('alimentation . salariés . végétarien . nombre de repas'),
    input('alimentation . salariés . végétalien . nombre de repas'),
  ],
  AutresIntrants: [input('intrants-biens-et-matières . autres-produits-manufacturés . nombre')],
  PapiersCartons: [input('intrants-biens-et-matières . papier-carton . nombre')],
  TransportFabricationDesVehicules: [
    input('fret . fabrication . voitures . nombre'),
    input('fret . fabrication . VUL . nombre'),
    input('fret . fabrication . PL . nombre'),
  ],
  Entrant: [
    input('fret . transport . présent'),
    input('fret . transport . carburant . litre'),
    input('fret . transport . livraisons'),
    input('fret . transport . poids'),
    input('fret . transport . local . provenance'),
    input('fret . transport . national . provenance'),
    input('fret . transport . europe . provenance'),
    input('fret . transport . international . provenance'),
  ],
  DeplacementsDesBeneficiaires: [
    input('déplacements . bénéficiaires . se déplacent'),
    input('déplacements . bénéficiaires . part voiture'),
    input('déplacements . bénéficiaires . voiture'),
    input('déplacements . bénéficiaires . part actif'),
    input('déplacements . bénéficiaires . actif'),
    input('déplacements . bénéficiaires . part deux roues'),
    input('déplacements . bénéficiaires . deux roues'),
    input('déplacements . bénéficiaires . part transport en commun'),
    input('déplacements . bénéficiaires . transport en commun'),
    input('déplacements . bénéficiaires . part train'),
    input('déplacements . bénéficiaires . train'),
    input('déplacements . bénéficiaires . part avion'),
    input('déplacements . bénéficiaires . avion'),
  ],
  DeplacementsDomicileTravailSalaries: [
    input('déplacements . DT-salariés . MEP présent'),
    input('déplacements . DT-salariés . MEP présent . nombre bénévoles'),
    input('déplacements . DT-salariés . MEP présent . nombre salariés'),
    input('déplacements . DT-salariés . avec . distance'),
    input('déplacements . DT-salariés . avec . réponse MEP'),
    input('déplacements . DT-salariés . sans . voiture . distance'),
    input('déplacements . DT-salariés . sans . train . distance'),
    input('déplacements . DT-salariés . sans . transports en commun . distance'),
    input('déplacements . DT-salariés . sans . deux roues . distance'),
  ],
  DeplacementsDomicileTravailBenevoles: [
    input('déplacements . DT-bénévoles . avec . distance'),
    input('déplacements . DT-bénévoles . avec . réponse MEP'),
    input('déplacements . DT-bénévoles . sans . voiture . distance'),
    input('déplacements . DT-bénévoles . sans . train . distance'),
    input('déplacements . DT-bénévoles . sans . transports en commun . distance'),
    input('déplacements . DT-bénévoles . sans . deux roues . distance'),
  ],
  DeplacementsDansLeCadreDUneMissionAssociativeSalaries: [
    input('déplacements . DM-salariés . sans . voiture . distance'),
    input('déplacements . DM-salariés . sans . train . distance'),
    input('déplacements . DM-salariés . sans . transports en commun . distance'),
    input('déplacements . DM-salariés . sans . deux roues . distance'),
    input('déplacements . DM-salariés . sans . avion . court courrier . distance'),
    input('déplacements . DM-salariés . sans . avion . moyen courrier . distance'),
    input('déplacements . DM-salariés . sans . avion . long courrier . distance'),
  ],
  DeplacementsDansLeCadreDUneMissionAssociativeBenevoles: [
    input('déplacements . DM-bénévoles . sans . voiture . distance'),
    input('déplacements . DM-bénévoles . sans . train . distance'),
    input('déplacements . DM-bénévoles . sans . transports en commun . distance'),
    input('déplacements . DM-bénévoles . sans . deux roues . distance'),
    input('déplacements . DM-bénévoles . sans . avion . court courrier . distance'),
    input('déplacements . DM-bénévoles . sans . avion . moyen courrier . distance'),
    input('déplacements . DM-bénévoles . sans . avion . long courrier . distance'),
  ],

  // Batiment: [
  //   input('fonctionnement . bâtiment . construction . surface'),
  //   input('fonctionnement . bâtiment . construction . année de construction'),
  //   group('BatimentRenovation.question', [
  //     'fonctionnement . bâtiment . rénovation . type . rénovation totale',
  //     'fonctionnement . bâtiment . rénovation . type . extension',
  //     'fonctionnement . bâtiment . rénovation . type . autres travaux importants',
  //     'fonctionnement . bâtiment . rénovation . type . aucun',
  //   ]),
  //   input('fonctionnement . bâtiment . rénovation . empreinte travaux . montant'),
  //   input('fonctionnement . bâtiment . rénovation . empreinte extension . surface'),
  //   input('fonctionnement . bâtiment . est partagé'),
  //   input('fonctionnement . bâtiment . autre activité . surface'),
  //   input('fonctionnement . bâtiment . parking présent'),
  //   input('fonctionnement . bâtiment . parking . nombre de places'),
  // ],
  // Equipe: [
  //   list('fonctionnement . équipe . collaborateurs', [
  //     'fonctionnement . équipe . collaborateur type . nombre de jours par semaine',
  //     'fonctionnement . équipe . collaborateur type . transport . moyen de transport',
  //     'fonctionnement . équipe . collaborateur type . transport . distance',
  //   ]),
  // ],
  // DeplacementsProfessionnels: [
  //   list('fonctionnement . déplacements pro . déplacements', [
  //     'fonctionnement . déplacements pro . déplacement type . transport . distance',
  //     'fonctionnement . déplacements pro . déplacement type . nombre participants',
  //     'fonctionnement . déplacements pro . déplacement type . transport . moyen de transport',
  //     'fonctionnement . déplacements pro . déplacement type . nombre occurences',
  //     'fonctionnement . déplacements pro . déplacement type . type hébergement',
  //     'fonctionnement . déplacements pro . déplacement type . nombre de nuitées',
  //   ]),
  // ],
  // Energie: [
  //   input('fonctionnement . énergie . électricité . consommation'),
  //   input('fonctionnement . énergie . gaz . consommation'),
  //   input('fonctionnement . énergie . fioul . consommation'),
  //   input('fonctionnement . énergie . réseau de chaleur . consommation'),
  //   input('fonctionnement . énergie . réseau de froid . consommation'),
  //   input('fonctionnement . énergie . granulés . consommation'),
  //   input('fonctionnement . énergie . est équipé climatisation'),
  //   input('fonctionnement . énergie . équipement groupes électrogènes'),
  //   input('fonctionnement . énergie . groupes électrogènes . consommation'),
  // ],
  // ActivitesDeBureau: [
  //   input('fonctionnement . activités de bureau . petites fournitures . montant'),
  //   input('fonctionnement . activités de bureau . services . montant'),
  //   list('fonctionnement . activités de bureau . informatique', [
  //     'fonctionnement . activités de bureau . informatique . équipement',
  //     'fonctionnement . activités de bureau . informatique . appareil . année achat',
  //     'fonctionnement . activités de bureau . informatique . appareil . durée location',
  //     'fonctionnement . activités de bureau . informatique . appareil . nb appareils',
  //   ]),
  // ],
  // MobiliteSpectateurs: [
  //   input('mobilité spectateurs . précision'),
  //   table(
  //     'MobiliteSpectateurs.question',
  //     ['MobiliteSpectateurs.moyenTransport', 'MobiliteSpectateurs.distance'],
  //     [
  //       [
  //         'mobilité spectateurs . résultat précis . empreinte . RER et transilien',
  //         'mobilité spectateurs . résultat précis . empreinte . RER et transilien . distance',
  //       ],
  //       [
  //         'mobilité spectateurs . résultat précis . empreinte . métro ou tram',
  //         'mobilité spectateurs . résultat précis . empreinte . métro ou tram . distance',
  //       ],
  //       [
  //         'mobilité spectateurs . résultat précis . empreinte . bus',
  //         'mobilité spectateurs . résultat précis . empreinte . bus . distance',
  //       ],
  //       [
  //         'mobilité spectateurs . résultat précis . empreinte . vélo électrique',
  //         'mobilité spectateurs . résultat précis . empreinte . vélo électrique . distance',
  //       ],
  //       [
  //         'mobilité spectateurs . résultat précis . empreinte . vélo classique',
  //         'mobilité spectateurs . résultat précis . empreinte . vélo classique . distance',
  //       ],
  //       [
  //         'mobilité spectateurs . résultat précis . empreinte . marche',
  //         'mobilité spectateurs . résultat précis . empreinte . marche . distance',
  //       ],
  //       [
  //         'mobilité spectateurs . résultat précis . empreinte . voiture diesel',
  //         'mobilité spectateurs . résultat précis . empreinte . voiture diesel . distance',
  //       ],
  //       [
  //         'mobilité spectateurs . résultat précis . empreinte . voiture essence',
  //         'mobilité spectateurs . résultat précis . empreinte . voiture essence . distance',
  //       ],
  //       [
  //         'mobilité spectateurs . résultat précis . empreinte . voiture hybride',
  //         'mobilité spectateurs . résultat précis . empreinte . voiture hybride . distance',
  //       ],
  //       [
  //         'mobilité spectateurs . résultat précis . empreinte . voiture électrique',
  //         'mobilité spectateurs . résultat précis . empreinte . voiture électrique . distance',
  //       ],
  //       [
  //         'mobilité spectateurs . résultat précis . empreinte . moto',
  //         'mobilité spectateurs . résultat précis . empreinte . moto . distance',
  //       ],
  //       [
  //         'mobilité spectateurs . résultat précis . empreinte . scooter',
  //         'mobilité spectateurs . résultat précis . empreinte . scooter . distance',
  //       ],
  //       [
  //         'mobilité spectateurs . résultat précis . empreinte . trottinette électrique',
  //         'mobilité spectateurs . résultat précis . empreinte . trottinette électrique . distance',
  //       ],
  //     ],
  //   ),
  //   input('mobilité spectateurs . mobilité spectateurs . contact'),
  //   input('mobilité spectateurs . résultat estimé . profil établissement'),
  //   input('mobilité spectateurs . résultat estimé . proximité spectateurs'),
  // ],
  // EquipesRecues: [input('tournées avant premières . équipes reçues . nombre équipes')],
  // MaterielTechnique: [
  //   list('salles et cabines . matériel technique . salles', [
  //     'salles et cabines . matériel technique . salle . nom',
  //     'salles et cabines . matériel technique . salle . projecteur . type',
  //     'salles et cabines . matériel technique . salle . projecteur . année achat',
  //     'salles et cabines . matériel technique . salle . écran . type',
  //     'salles et cabines . matériel technique . salle . écran . surface écran',
  //     'salles et cabines . matériel technique . salle . écran . année achat',
  //     'salles et cabines . matériel technique . salle . fauteuils . type',
  //     'salles et cabines . matériel technique . salle . fauteuils . nombre',
  //     'salles et cabines . matériel technique . salle . fauteuils . année achat',
  //     'salles et cabines . matériel technique . salle . système son . type',
  //     'salles et cabines . matériel technique . salle . système son . année achat',
  //   ]),
  //   input('salles et cabines . matériel technique . films . nombre films dématérialisés'),
  //   input('salles et cabines . matériel technique . cloud . stockage'),
  //   input('salles et cabines . matériel technique . disques durs . nombre'),
  // ],
  // AutreMateriel: [input('salles et cabines . autre matériel . lunettes 3D . nombre')],
  // Achats: [
  //   input('confiseries et boissons . achats . vente sur place'),
  //   input('confiseries et boissons . achats . achat type'),
  // ],
  // Fret: [input('confiseries et boissons . fret . distance')],
  // Electromenager: [
  //   table(
  //     'Electromenager.question',
  //     [
  //       'Electromenager.typeEquipement',
  //       'Electromenager.nombre',
  //       'Electromenager.dateAchat',
  //       'Electromenager.dureeLocation',
  //     ],
  //     [
  //       [
  //         'confiseries et boissons . électroménager . réfrigérateurs',
  //         'confiseries et boissons . électroménager . réfrigérateurs . nombre',
  //         'confiseries et boissons . électroménager . réfrigérateurs . année achat',
  //         'confiseries et boissons . électroménager . réfrigérateurs . durée location',
  //       ],
  //       [
  //         'confiseries et boissons . électroménager . congélateurs',
  //         'confiseries et boissons . électroménager . congélateurs . nombre',
  //         'confiseries et boissons . électroménager . congélateurs . année achat',
  //         'confiseries et boissons . électroménager . congélateurs . durée location',
  //       ],
  //       [
  //         'confiseries et boissons . électroménager . warmers',
  //         'confiseries et boissons . électroménager . warmers . nombre',
  //         'confiseries et boissons . électroménager . warmers . année achat',
  //         'confiseries et boissons . électroménager . warmers . durée location',
  //       ],
  //       [
  //         'confiseries et boissons . électroménager . distributeurs',
  //         'confiseries et boissons . électroménager . distributeurs . nombre',
  //         'confiseries et boissons . électroménager . distributeurs . année achat',
  //         'confiseries et boissons . électroménager . distributeurs . durée location',
  //       ],
  //     ],
  //   ),
  // ],
  // DechetsOrdinaires: [
  //   table(
  //     'DechetsOrdinaires.question',
  //     [
  //       'DechetsOrdinaires.typeDechet',
  //       'DechetsOrdinaires.nbBennes',
  //       'DechetsOrdinaires.tailleBennes',
  //       'DechetsOrdinaires.frequenceRamassage',
  //     ],
  //     [
  //       [
  //         'déchets . ordinaires . ordures ménagères',
  //         'déchets . ordinaires . ordures ménagères . nombre bennes',
  //         'déchets . ordinaires . ordures ménagères . taille benne',
  //         'déchets . ordinaires . ordures ménagères . fréquence ramassage',
  //       ],
  //       [
  //         'déchets . ordinaires . emballages et papier',
  //         'déchets . ordinaires . emballages et papier . nombre bennes',
  //         'déchets . ordinaires . emballages et papier . taille benne',
  //         'déchets . ordinaires . emballages et papier . fréquence ramassage',
  //       ],
  //       [
  //         'déchets . ordinaires . biodéchets',
  //         'déchets . ordinaires . biodéchets . nombre bennes',
  //         'déchets . ordinaires . biodéchets . taille benne',
  //         'déchets . ordinaires . biodéchets . fréquence ramassage',
  //       ],
  //       [
  //         'déchets . ordinaires . verre',
  //         'déchets . ordinaires . verre . nombre bennes',
  //         'déchets . ordinaires . verre . taille benne',
  //         'déchets . ordinaires . verre . fréquence ramassage',
  //       ],
  //     ],
  //   ),
  // ],
  // DechetsExceptionnels: [
  //   input('déchets . exceptionnels . lampe xenon . nombre'),
  //   input('déchets . exceptionnels . matériel technique . quantité'),
  // ],
  // MaterielDistributeurs: [
  //   table(
  //     'MaterielDistributeursAffiches.question',
  //     ['MaterielDistributeursAffiches.typeMateriel', 'MaterielDistributeursAffiches.quantite'],
  //     [
  //       [
  //         'billetterie et communication . matériel distributeurs . affiches . affiches 120x160',
  //         'billetterie et communication . matériel distributeurs . affiches . affiches 120x160 . nombre',
  //       ],
  //       [
  //         'billetterie et communication . matériel distributeurs . affiches . affiches 40x60',
  //         'billetterie et communication . matériel distributeurs . affiches . affiches 40x60 . nombre',
  //       ],
  //     ],
  //   ),
  //   table(
  //     'MaterielDistributeursPLV.question',
  //     ['MaterielDistributeursPLV.typeMateriel', 'MaterielDistributeursPLV.quantite'],
  //     [
  //       [
  //         'billetterie et communication . matériel distributeurs . PLV . PLV comptoir',
  //         'billetterie et communication . matériel distributeurs . PLV . PLV comptoir . nombre',
  //       ],
  //       [
  //         'billetterie et communication . matériel distributeurs . PLV . PLV grand format',
  //         'billetterie et communication . matériel distributeurs . PLV . PLV grand format . nombre',
  //       ],
  //     ],
  //   ),
  // ],
  // MaterielCinema: [
  //   table(
  //     'MaterielCinema.question',
  //     ['MaterielCinema.typeMateriel', 'MaterielCinema.quantite'],
  //     [
  //       [
  //         'billetterie et communication . matériel cinéma . production . programme',
  //         'billetterie et communication . matériel cinéma . production . programme . nombre',
  //       ],
  //       [
  //         'billetterie et communication . matériel cinéma . production . affiches',
  //         'billetterie et communication . matériel cinéma . production . affiches . nombre',
  //       ],
  //       [
  //         'billetterie et communication . matériel cinéma . production . flyers',
  //         'billetterie et communication . matériel cinéma . production . flyers . nombre',
  //       ],
  //     ],
  //   ),
  // ],
  // CommunicationDigitale: [
  //   input('billetterie et communication . communication digitale . newsletters . nombre'),
  //   input('billetterie et communication . communication digitale . newsletters . destinataires'),
  //   input('billetterie et communication . communication digitale . affichage dynamique . nombre'),
  //   input('billetterie et communication . communication digitale . écrans . nombre'),
  //   input('billetterie et communication . communication digitale . affichage extérieur . surface'),
  // ],
  // CaissesEtBornes: [
  //   input('billetterie et communication . caisses et bornes . caisses libre service . nombre'),
  //   input('billetterie et communication . caisses et bornes . caisse classique . nombre'),
  // ],
} as const
