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

export const POST_TO_RULENAME: Partial<Record<TiltPost, TiltRuleName>> = {
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
  // DechetsOrganiques: "",
  // DechetsOrduresMenageres: "",
  FroidEtClim: 'froid et clim',
  // EmissionsLieesAuChangementDAffectationDesSolsCas,
  DeplacementsDomicileTravailSalaries: 'déplacements . DT-salariés',
  DeplacementsDomicileTravailBenevoles: 'déplacements . DT-bénévoles',
  DeplacementsDansLeCadreDUneMissionAssociativeSalaries: 'déplacements . DM-salariés',
  DeplacementsDansLeCadreDUneMissionAssociativeBenevoles: 'déplacements . DM-bénévoles',
  DeplacementsDesBeneficiaires: 'déplacements . bénéficiaires',
  DeplacementsFabricationDesVehicules: 'déplacements . fabrication',
  Entrant: 'fret . transport',
  // Interne: "fret . transport",
  // Sortant: "fret . transport",
  TransportFabricationDesVehicules: 'fret . fabrication',
  MetauxPlastiquesEtVerre: 'intrants-biens-et-matières . ratios monétaires',
  // PapiersCartons: "",
  // MateriauxDeConstruction: "",
  // ProduitsChimiquesEtHydrogene: "",
  // MatiereDestineeAuxEmballages: "",
  // AutresIntrants: "",
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
  FroidEtClim: [
    input('froid et clim . nombre'),
    input('froid et clim . fuites . locaux partagés'),
    input('froid et clim . fuites . locaux seuls'),
  ],
  DechetsDEmballagesEtPlastiques: [
    table(
      'DechetsDirects.question',
      ['DechetsDirects.typeDéchets', 'DechetsDirects.poids'],
      [
        [
          'déchets . emballages et plastiques . poubelle noire',
          'déchets . emballages et plastiques . poubelle noire . poids',
        ],
        [
          'déchets . emballages et plastiques . poubelle jaune',
          'déchets . emballages et plastiques . poubelle jaune . poids',
        ],
        [
          'déchets . emballages et plastiques . déchets verre',
          'déchets . emballages et plastiques . déchets verre . poids',
        ],
        [
          'déchets . emballages et plastiques . déchets verts',
          'déchets . emballages et plastiques . déchets verts . poids',
        ],
      ],
    ),
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
    table(
      'EquipementsEtImmobilisations.question',
      ['EquipementsEtImmobilisations.typeEquipement', 'EquipementsEtImmobilisations.nombreEquipement'],
      [
        [
          'équipements et immobilisations . infos . ordinateurs fixes',
          'équipements et immobilisations . infos . ordinateurs fixes . quantité',
        ],
        [
          'équipements et immobilisations . infos . ordinateurs portables',
          'équipements et immobilisations . infos . ordinateurs portables . quantité',
        ],
        [
          'équipements et immobilisations . infos . photocopieurs',
          'équipements et immobilisations . infos . photocopieurs . quantité',
        ],
        [
          'équipements et immobilisations . infos . imprimantes',
          'équipements et immobilisations . infos . imprimantes . quantité',
        ],
        [
          'équipements et immobilisations . infos . téléphones fixes',
          'équipements et immobilisations . infos . téléphones fixes . quantité',
        ],
        [
          'équipements et immobilisations . infos . téléphones portables',
          'équipements et immobilisations . infos . téléphones portables . quantité',
        ],
        [
          'équipements et immobilisations . infos . vidéoprojecteurs',
          'équipements et immobilisations . infos . vidéoprojecteurs . quantité',
        ],
        [
          'équipements et immobilisations . infos . autres écrans',
          'équipements et immobilisations . infos . autres écrans . quantité',
        ],
      ],
    ),
    input('équipements et immobilisations . infos . prise en compte reconditionné'),
  ],
  ServicesEnApprocheMonetaire: [
    table(
      'IntrantsServices.question',
      ['IntrantsServices.typeService', 'IntrantsServices.montantDepense'],
      [
        [
          'intrants-services . services . spectacles-musées',
          'intrants-services . services . spectacles-musées . montant-dépensé',
        ],
        [
          'intrants-services . services . assurance-reassurance',
          'intrants-services . services . assurance-reassurance . montant-dépensé',
        ],
        ['intrants-services . services . telecom', 'intrants-services . services . telecom . montant-dépensé'],
        [
          'intrants-services . services . sante-humaine',
          'intrants-services . services . sante-humaine . montant-dépensé',
        ],
        ['intrants-services . services . edition', 'intrants-services . services . edition . montant-dépensé'],
        [
          'intrants-services . services . poste-courrier',
          'intrants-services . services . poste-courrier . montant-dépensé',
        ],
        [
          'intrants-services . services . restauration',
          'intrants-services . services . restauration . montant-dépensé',
        ],
        ['intrants-services . services . formation', 'intrants-services . services . formation . montant-dépensé'],
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
  MetauxPlastiquesEtVerre: [
    table(
      'IntrantsBiensEtMatieresTilt.question',
      ['IntrantsBiensEtMatieresTilt.typeBien', 'IntrantsBiensEtMatieresTilt.montantDepense'],
      [
        [
          'intrants-biens-et-matières . ratios monétaires . petites-fournitures',
          'intrants-biens-et-matières . ratios monétaires . petites-fournitures . nombre',
        ],
        [
          'intrants-biens-et-matières . ratios monétaires . meubles',
          'intrants-biens-et-matières . ratios monétaires . meubles . nombre',
        ],
        [
          'intrants-biens-et-matières . ratios monétaires . machines-équipements',
          'intrants-biens-et-matières . ratios monétaires . machines-équipements . nombre',
        ],
        [
          'intrants-biens-et-matières . ratios monétaires . textiles',
          'intrants-biens-et-matières . ratios monétaires . textiles . nombre',
        ],
        [
          'intrants-biens-et-matières . ratios monétaires . produits-pharmaceutiques',
          'intrants-biens-et-matières . ratios monétaires . produits-pharmaceutiques . nombre',
        ],
        [
          'intrants-biens-et-matières . ratios monétaires . produits-chimiques',
          'intrants-biens-et-matières . ratios monétaires . produits-chimiques . nombre',
        ],
        [
          'intrants-biens-et-matières . ratios monétaires . papier-carton',
          'intrants-biens-et-matières . ratios monétaires . papier-carton . nombre',
        ],
        [
          'intrants-biens-et-matières . ratios monétaires . produits-métalliques',
          'intrants-biens-et-matières . ratios monétaires . produits-métalliques . nombre',
        ],
        [
          'intrants-biens-et-matières . ratios monétaires . autres-produits-manufacturés',
          'intrants-biens-et-matières . ratios monétaires . autres-produits-manufacturés . nombre',
        ],
      ],
    ),
  ],
  TransportFabricationDesVehicules: [
    input('fret . fabrication . VUL . nombre'),
    input('fret . fabrication . PL . nombre'),
  ],
  Entrant: [
    input('fret . transport . présent'),
    input('fret . transport . carburant . litre'),
    input('fret . transport . livraisons'),
    input('fret . transport . poids'),
    table(
      'TransportDeMarchandises.question',
      ['TransportDeMarchandises.typeProvenance', 'TransportDeMarchandises.pourcentageLivraisons'],
      [
        ['fret . transport . local', 'fret . transport . local . provenance'],
        ['fret . transport . national', 'fret . transport . national . provenance'],
        ['fret . transport . europe', 'fret . transport . europe . provenance'],
        ['fret . transport . international', 'fret . transport . international . provenance'],
      ],
    ),
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
    input('général . salariés'),
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
    input('général . bénévoles'),
    input('déplacements . DT-bénévoles . avec . distance'),
    input('déplacements . DT-bénévoles . avec . réponse MEP'),
    input('déplacements . DT-bénévoles . sans . voiture . distance'),
    input('déplacements . DT-bénévoles . sans . train . distance'),
    input('déplacements . DT-bénévoles . sans . transports en commun . distance'),
    input('déplacements . DT-bénévoles . sans . deux roues . distance'),
  ],
  DeplacementsDansLeCadreDUneMissionAssociativeSalaries: [
    input('déplacements . DM-salariés . avec . émissions MEP . voiture'),
    input('déplacements . DM-salariés . avec . émissions MEP . train'),
    input('déplacements . DM-salariés . avec . émissions MEP . avion'),
    input('déplacements . DM-salariés . avec . émissions MEP . transports en commun'),
    input('déplacements . DM-salariés . avec . émissions MEP . deux roues'),
    input('déplacements . DM-salariés . sans . voiture . distance'),
    input('déplacements . DM-salariés . sans . train . distance'),
    input('déplacements . DM-salariés . sans . transports en commun . distance'),
    input('déplacements . DM-salariés . sans . deux roues . distance'),
    input('déplacements . DM-salariés . sans . avion . court courrier . distance'),
    input('déplacements . DM-salariés . sans . avion . moyen courrier . distance'),
    input('déplacements . DM-salariés . sans . avion . long courrier . distance'),
  ],
  DeplacementsDansLeCadreDUneMissionAssociativeBenevoles: [
    input('déplacements . DM-bénévoles . avec . émissions MEP . voiture'),
    input('déplacements . DM-bénévoles . avec . émissions MEP . train'),
    input('déplacements . DM-bénévoles . avec . émissions MEP . avion'),
    input('déplacements . DM-bénévoles . avec . émissions MEP . transports en commun'),
    input('déplacements . DM-bénévoles . avec . émissions MEP . deux roues'),
    input('déplacements . DM-bénévoles . sans . voiture . distance'),
    input('déplacements . DM-bénévoles . sans . train . distance'),
    input('déplacements . DM-bénévoles . sans . transports en commun . distance'),
    input('déplacements . DM-bénévoles . sans . deux roues . distance'),
    input('déplacements . DM-bénévoles . sans . avion . court courrier . distance'),
    input('déplacements . DM-bénévoles . sans . avion . moyen courrier . distance'),
    input('déplacements . DM-bénévoles . sans . avion . long courrier . distance'),
  ],
  DeplacementsFabricationDesVehicules: [input('déplacements . fabrication . voitures . nombre')],
} as const
