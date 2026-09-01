import { SubPost } from '@abc-transitionbascarbone/db-common/enums'
import {
  FormLayout,
  groupLayout,
  inputLayout,
  listLayout,
  mosaicLayout,
  tableLayout,
} from '@abc-transitionbascarbone/publicodes/form/layouts'
import { TiltSimplifiedPost } from '@abc-transitionbascarbone/services/results/posts.enums'
import { TiltRuleName } from './types'

export const getPostRuleNameTilt = (post: TiltSimplifiedPost): TiltRuleName | '' => {
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

export const POST_TO_RULENAME: Record<TiltSimplifiedPost, TiltRuleName> = {
  [TiltSimplifiedPost.LocauxSimplified]: 'construction',
  [TiltSimplifiedPost.EnergieSimplified]: 'énergie',
  [TiltSimplifiedPost.DechetsSimplified]: 'déchets',
  [TiltSimplifiedPost.FroidEtClimSimplified]: 'froid et clim',
  [TiltSimplifiedPost.DeplacementsDePersonneSimplified]: 'déplacements',
  [TiltSimplifiedPost.TransportDeMarchandisesSimplified]: 'fret',
  [TiltSimplifiedPost.IntrantsBiensEtMatieresTiltSimplified]: 'intrants-biens-et-matières',
  [TiltSimplifiedPost.AlimentationSimplified]: 'alimentation',
  [TiltSimplifiedPost.ServiceEtNumeriqueSimplified]: 'intrants-services',
  [TiltSimplifiedPost.EquipementsEtImmobilisationsSimplified]: 'équipements et immobilisations',
  [TiltSimplifiedPost.UtilisationSimplified]: 'utilisation',
  [TiltSimplifiedPost.FinDeVieSimplified]: 'fin de vie',
  [TiltSimplifiedPost.TeletravailSimplified]: 'télétravail',
  [TiltSimplifiedPost.EvenementSimplified]: 'événement',
} as const

const SUBPOST_TO_RULENAME: Partial<Record<SubPost, TiltRuleName>> = {
  Batiments: 'construction . bâtiment',
  AutresInfrastructures: 'construction . infrastructure',
  // CombustiblesFossiles: 'énergie . fossiles',
  EnergieSimplified: 'énergie . combustibles organiques',
  // ReseauxDeChaleurEtDeVapeur: 'énergie . réseaux de chaleur',
  // ReseauxDeFroid: 'énergie . réseaux de froid',
  // Electricite: 'énergie . électricité',
  DechetsEmisParLOrganisation: 'déchets . emballages et plastiques',
  FroidEtClim: 'froid et clim',
  DeplacementsDomicileTravailSalaries: 'déplacements . DT-salariés',
  DeplacementsBenevoles: 'déplacements . DT-bénévoles',
  DeplacementsDansLeCadreDUneMissionAssociativeSalaries: 'déplacements . DM-salariés',
  //DeplacementsDansLeCadreDUneMissionAssociativeBenevoles,
  DeplacementsDesBeneficiaires: 'déplacements . bénéficiaires',
  DeplacementsFabricationDesVehicules: 'déplacements . fabrication',
  Fret: 'fret . transport',
  BienMatieres: 'intrants-biens-et-matières . ratios monétaires',
  RepasPrisParLesSalaries: 'alimentation . mosaic salariés',
  RepasPrisParLesBenevoles: 'alimentation . mosaic bénévoles',
  RepasPrisParLesBeneficiaires: 'alimentation . bénéficiaires',
  UsagesNumeriques: 'intrants-services . numérique',
  ServicesEnApprocheMonetaire: 'intrants-services . approche monétaire',
  EquipementsDesSalaries: 'équipements et immobilisations',
  ConsommationsEnergieUtilisationProduits: 'utilisation . responsabilite conso energie',
  FinDeVieProduitsVendusFournisBeneficiaires: 'fin de vie',
  TeletravailSalariesBenevoles: 'télétravail',
  Evenement: 'événement',
} as const

const input = (rule: TiltRuleName): FormLayout<TiltRuleName> => inputLayout<TiltRuleName>(rule)
const group = (title: string, rules: TiltRuleName[], description?: string): FormLayout<TiltRuleName> =>
  groupLayout<TiltRuleName>(title, rules, description)
const table = (
  title: string,
  headers: string[],
  rows: TiltRuleName[][],
  description?: string,
): FormLayout<TiltRuleName> => tableLayout<TiltRuleName>(title, headers, rows, description)
const mosaic = (parent: TiltRuleName, children: TiltRuleName[]): FormLayout<TiltRuleName> =>
  mosaicLayout<TiltRuleName>(parent, children)
const list = (targetRule: TiltRuleName, rules: TiltRuleName[]): FormLayout<TiltRuleName> =>
  listLayout<TiltRuleName>(targetRule, rules)

export const SUBPOST_TO_FORM_LAYOUTS: Partial<Record<SubPost, FormLayout<TiltRuleName>[]>> = {
  Batiments: [
    input('construction . bâtiment . locaux'),
    input('construction . bâtiment . locaux . locaux seuls . surface'),
    input('construction . bâtiment . locaux . locaux partagés . surface'),
    input('construction . bâtiment . locaux . locaux partagés . pourcentage'),
    input('construction . bâtiment . locaux ponctuels existants'),
    list('construction . bâtiment . locaux ponctuels', [
      'construction . bâtiment . locaux ponctuels . nom',
      'construction . bâtiment . locaux ponctuels . calcul . surface',
      'construction . bâtiment . locaux ponctuels . calcul . durée',
    ]),
  ],
  AutresInfrastructures: [
    input('construction . infrastructure . parking présent'),
    input('construction . infrastructure . nombre de places'),
  ],
  EnergieSimplified: [
    group('EnergieBooléen.question', [
      'énergie . combustibles organiques . types . électricité présent',
      'énergie . combustibles organiques . types . gaz présent',
      'énergie . combustibles organiques . types . fioul présent',
      'énergie . combustibles organiques . types . bois présent',
      'énergie . combustibles organiques . types . granulés présent',
      'énergie . combustibles organiques . types . réseaux de chaleur présent',
      'énergie . combustibles organiques . types . réseaux de froid présent',
    ]),
    input('énergie . combustibles organiques . types . chauffage électrique'),
    mosaic('énergie . combustibles organiques . emissions', [
      'énergie . combustibles organiques . emissions . électricité . consommation',
      'énergie . combustibles organiques . emissions . gaz . consommation',
      'énergie . combustibles organiques . emissions . fioul . consommation',
      'énergie . combustibles organiques . emissions . bois . consommation',
      'énergie . combustibles organiques . emissions . granulés . consommation',
      'énergie . combustibles organiques . emissions . réseaux de chaleur . consommation',
      'énergie . combustibles organiques . emissions . réseaux de froid . consommation',
    ]),
    input('énergie . combustibles organiques . autoproduction électricité présente'),
    input('énergie . combustibles organiques . autoconsommation électricité . autoconsommation'),
  ],

  FroidEtClim: [input('froid et clim . nombre')],
  DechetsEmisParLOrganisation: [
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
      'DechetsDirects.description',
    ),
  ],
  FinDeVieProduitsVendusFournisBeneficiaires: [
    input('fin de vie . fin de vie présente'),
    input('fin de vie . total sans reconditionné . poids'),
    input('fin de vie . pondération . reconditionné'),
  ],
  ConsommationsEnergieUtilisationProduits: [
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
          'équipements et immobilisations . total sans reconditionné . ordinateurs fixes',
          'équipements et immobilisations . total sans reconditionné . ordinateurs fixes . quantité',
        ],
        [
          'équipements et immobilisations . total sans reconditionné . ordinateurs portables',
          'équipements et immobilisations . total sans reconditionné . ordinateurs portables . quantité',
        ],
        [
          'équipements et immobilisations . total sans reconditionné . photocopieurs',
          'équipements et immobilisations . total sans reconditionné . photocopieurs . quantité',
        ],
        [
          'équipements et immobilisations . total sans reconditionné . imprimantes',
          'équipements et immobilisations . total sans reconditionné . imprimantes . quantité',
        ],
        [
          'équipements et immobilisations . total sans reconditionné . téléphones fixes',
          'équipements et immobilisations . total sans reconditionné . téléphones fixes . quantité',
        ],
        [
          'équipements et immobilisations . total sans reconditionné . téléphones portables',
          'équipements et immobilisations . total sans reconditionné . téléphones portables . quantité',
        ],
        [
          'équipements et immobilisations . total sans reconditionné . vidéoprojecteurs',
          'équipements et immobilisations . total sans reconditionné . vidéoprojecteurs . quantité',
        ],
        [
          'équipements et immobilisations . total sans reconditionné . autres écrans',
          'équipements et immobilisations . total sans reconditionné . autres écrans . quantité',
        ],
      ],
    ),
    input('équipements et immobilisations . pondération . reconditionné'),
  ],
  ServicesEnApprocheMonetaire: [
    input('intrants-services . approche monétaire . existant'),
    input('intrants-services . approche monétaire . FE moyen . montant dépensé'),
    table(
      'IntrantsServices.question',
      ['IntrantsServices.typeService', 'IntrantsServices.montantDepense'],
      [
        [
          'intrants-services . approche monétaire . tableau détaillé . spectacles-musées',
          'intrants-services . approche monétaire . tableau détaillé . spectacles-musées . montant-dépensé',
        ],
        [
          'intrants-services . approche monétaire . tableau détaillé . assurance-reassurance',
          'intrants-services . approche monétaire . tableau détaillé . assurance-reassurance . montant-dépensé',
        ],
        [
          'intrants-services . approche monétaire . tableau détaillé . telecom',
          'intrants-services . approche monétaire . tableau détaillé . telecom . montant-dépensé',
        ],
        [
          'intrants-services . approche monétaire . tableau détaillé . sante-humaine',
          'intrants-services . approche monétaire . tableau détaillé . sante-humaine . montant-dépensé',
        ],
        [
          'intrants-services . approche monétaire . tableau détaillé . edition',
          'intrants-services . approche monétaire . tableau détaillé . edition . montant-dépensé',
        ],
        [
          'intrants-services . approche monétaire . tableau détaillé . poste-courrier',
          'intrants-services . approche monétaire . tableau détaillé . poste-courrier . montant-dépensé',
        ],
        [
          'intrants-services . approche monétaire . tableau détaillé . restauration',
          'intrants-services . approche monétaire . tableau détaillé . restauration . montant-dépensé',
        ],
        [
          'intrants-services . approche monétaire . tableau détaillé . formation',
          'intrants-services . approche monétaire . tableau détaillé . formation . montant-dépensé',
        ],
        [
          'intrants-services . approche monétaire . tableau détaillé . reparation-installation',
          'intrants-services . approche monétaire . tableau détaillé . reparation-installation . montant-dépensé',
        ],
        [
          'intrants-services . approche monétaire . tableau détaillé . juridique-comptable',
          'intrants-services . approche monétaire . tableau détaillé . juridique-comptable . montant-dépensé',
        ],
        [
          'intrants-services . approche monétaire . tableau détaillé . programmation-conseil',
          'intrants-services . approche monétaire . tableau détaillé . programmation-conseil . montant-dépensé',
        ],
      ],
      'IntrantsServices.description',
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
    mosaic('alimentation . bénéficiaires . mosaic bénéficiaires', [
      'alimentation . bénéficiaires . mosaic bénéficiaires . végétalien . nombre',
      'alimentation . bénéficiaires . mosaic bénéficiaires . végétarien . nombre',
      'alimentation . bénéficiaires . mosaic bénéficiaires . viande blanche . nombre',
      'alimentation . bénéficiaires . mosaic bénéficiaires . viande rouge . nombre',
      'alimentation . bénéficiaires . mosaic bénéficiaires . poisson gras . nombre',
      'alimentation . bénéficiaires . mosaic bénéficiaires . poisson blanc . nombre',
      'alimentation . bénéficiaires . mosaic bénéficiaires . repas moyen . nombre',
    ]),
  ],
  RepasPrisParLesBenevoles: [
    mosaic('alimentation . mosaic bénévoles', [
      'alimentation . mosaic bénévoles . végétalien . nombre',
      'alimentation . mosaic bénévoles . végétarien . nombre',
      'alimentation . mosaic bénévoles . viande blanche . nombre',
      'alimentation . mosaic bénévoles . viande rouge . nombre',
      'alimentation . mosaic bénévoles . poisson gras . nombre',
      'alimentation . mosaic bénévoles . poisson blanc . nombre',
      'alimentation . mosaic bénévoles . repas moyen . nombre',
    ]),
  ],
  RepasPrisParLesSalaries: [
    mosaic('alimentation . mosaic salariés', [
      'alimentation . mosaic salariés . végétalien . nombre',
      'alimentation . mosaic salariés . végétarien . nombre',
      'alimentation . mosaic salariés . viande blanche . nombre',
      'alimentation . mosaic salariés . viande rouge . nombre',
      'alimentation . mosaic salariés . poisson gras . nombre',
      'alimentation . mosaic salariés . poisson blanc . nombre',
      'alimentation . mosaic salariés . repas moyen . nombre',
    ]),
  ],
  BienMatieres: [
    input('intrants-biens-et-matières . ratios monétaires . existant'),
    input('intrants-biens-et-matières . ratios monétaires . ratio moyen'),
    table(
      'IntrantsBiensEtMatieresTilt.question',
      ['IntrantsBiensEtMatieresTilt.typeBien', 'IntrantsBiensEtMatieresTilt.montantDepense'],
      [
        [
          'intrants-biens-et-matières . ratios monétaires . tableau détaillé . petites-fournitures',
          'intrants-biens-et-matières . ratios monétaires . tableau détaillé . petites-fournitures . nombre',
        ],
        [
          'intrants-biens-et-matières . ratios monétaires . tableau détaillé . meubles',
          'intrants-biens-et-matières . ratios monétaires . tableau détaillé . meubles . nombre',
        ],
        [
          'intrants-biens-et-matières . ratios monétaires . tableau détaillé . machines-équipements',
          'intrants-biens-et-matières . ratios monétaires . tableau détaillé . machines-équipements . nombre',
        ],
        [
          'intrants-biens-et-matières . ratios monétaires . tableau détaillé . textiles',
          'intrants-biens-et-matières . ratios monétaires . tableau détaillé . textiles . nombre',
        ],
        [
          'intrants-biens-et-matières . ratios monétaires . tableau détaillé . produits-pharmaceutiques',
          'intrants-biens-et-matières . ratios monétaires . tableau détaillé . produits-pharmaceutiques . nombre',
        ],
        [
          'intrants-biens-et-matières . ratios monétaires . tableau détaillé . produits-chimiques',
          'intrants-biens-et-matières . ratios monétaires . tableau détaillé . produits-chimiques . nombre',
        ],
        [
          'intrants-biens-et-matières . ratios monétaires . tableau détaillé . papier-carton',
          'intrants-biens-et-matières . ratios monétaires . tableau détaillé . papier-carton . nombre',
        ],
        [
          'intrants-biens-et-matières . ratios monétaires . tableau détaillé . produits-métalliques',
          'intrants-biens-et-matières . ratios monétaires . tableau détaillé . produits-métalliques . nombre',
        ],
        [
          'intrants-biens-et-matières . ratios monétaires . tableau détaillé . autres-produits-manufacturés',
          'intrants-biens-et-matières . ratios monétaires . tableau détaillé . autres-produits-manufacturés . nombre',
        ],
      ],
      'IntrantsBiensEtMatieresTilt.description',
    ),
  ],
  Fret: [
    input('fret . transport . présent'),
    input('fret . transport . VUL . nombre'),
    input('fret . transport . PL . nombre'),
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
    table(
      'DeplacementsDesBeneficiaires.question',
      ['DeplacementsDesBeneficiaires.ModeTransport', 'DeplacementsDesBeneficiaires.TauxTransport'],
      [
        ['déplacements . bénéficiaires . part voiture', 'déplacements . bénéficiaires . part voiture'],
        ['déplacements . bénéficiaires . part train', 'déplacements . bénéficiaires . part train'],
        ['déplacements . bénéficiaires . part bus', 'déplacements . bénéficiaires . part bus'],
        ['déplacements . bénéficiaires . part deux roues', 'déplacements . bénéficiaires . part deux roues'],
        [
          'déplacements . bénéficiaires . part transport en commun',
          'déplacements . bénéficiaires . part transport en commun',
        ],
        ['déplacements . bénéficiaires . part avion', 'déplacements . bénéficiaires . part avion'],
        ['déplacements . bénéficiaires . part actif', 'déplacements . bénéficiaires . part actif'],
      ],
    ),
    table(
      'DeplacementsDesBeneficiaires.question2',
      ['DeplacementsDesBeneficiaires.ModeTransport2', 'DeplacementsDesBeneficiaires.DistanceMoyenne'],
      [
        ['déplacements . bénéficiaires . voiture', 'déplacements . bénéficiaires . voiture'],
        ['déplacements . bénéficiaires . train', 'déplacements . bénéficiaires . train'],
        ['déplacements . bénéficiaires . bus', 'déplacements . bénéficiaires . bus'],
        ['déplacements . bénéficiaires . deux roues', 'déplacements . bénéficiaires . deux roues'],
        ['déplacements . bénéficiaires . transport en commun', 'déplacements . bénéficiaires . transport en commun'],
        ['déplacements . bénéficiaires . avion', 'déplacements . bénéficiaires . avion'],
        ['déplacements . bénéficiaires . actif', 'déplacements . bénéficiaires . actif'],
      ],
    ),
  ],
  DeplacementsDomicileTravailSalaries: [
    // input('déplacements . DT-salariés . MEP présent'),
    // input('déplacements . DT-salariés . MEP présent . nombre bénévoles'),
    // input('déplacements . DT-salariés . MEP présent . nombre salariés'),
    // input('déplacements . DT-salariés . avec . distance'),
    // input('déplacements . DT-salariés . avec . réponse MEP'),
    table(
      'DomicileTravailSalaries.question',
      ['DomicileTravailSalaries.ModeTransport', 'DomicileTravailSalaries.TauxTransport'],
      [
        ['déplacements . DT-salariés . sans . part voiture', 'déplacements . DT-salariés . sans . part voiture'],
        ['déplacements . DT-salariés . sans . part train', 'déplacements . DT-salariés . sans . part train'],
        ['déplacements . DT-salariés . sans . part bus', 'déplacements . DT-salariés . sans . part bus'],
        [
          'déplacements . DT-salariés . sans . part transport en commun',
          'déplacements . DT-salariés . sans . part transport en commun',
        ],
        ['déplacements . DT-salariés . sans . part deux roues', 'déplacements . DT-salariés . sans . part deux roues'],
      ],
    ),
    table(
      'DomicileTravailSalaries.question2',
      ['DomicileTravailSalaries.ModeTransport2', 'DomicileTravailSalaries.DistanceMoyenne'],
      [
        ['déplacements . DT-salariés . sans . voiture', 'déplacements . DT-salariés . sans . voiture . distance'],
        ['déplacements . DT-salariés . sans . train', 'déplacements . DT-salariés . sans . train . distance'],
        ['déplacements . DT-salariés . sans . bus', 'déplacements . DT-salariés . sans . bus . distance'],
        [
          'déplacements . DT-salariés . sans . transports en commun',
          'déplacements . DT-salariés . sans . transports en commun . distance',
        ],
        ['déplacements . DT-salariés . sans . deux roues', 'déplacements . DT-salariés . sans . deux roues . distance'],
      ],
      'DomicileTravailSalaries.description',
    ),
  ],
  DeplacementsBenevoles: [
    // input('déplacements . DT-bénévoles . avec . distance'),
    // input('déplacements . DT-bénévoles . avec . réponse MEP'),
    table(
      'DeplacementsDomicileTravailBenevoles.question',
      ['DeplacementsDomicileTravailBenevoles.ModeTransport', 'DeplacementsDomicileTravailBenevoles.TauxTransport'],
      [
        ['déplacements . DT-bénévoles . sans . part voiture', 'déplacements . DT-bénévoles . sans . part voiture'],
        ['déplacements . DT-bénévoles . sans . part train', 'déplacements . DT-bénévoles . sans . part train'],
        ['déplacements . DT-bénévoles . sans . part bus', 'déplacements . DT-bénévoles . sans . part bus'],
        [
          'déplacements . DT-bénévoles . sans . part transport en commun',
          'déplacements . DT-bénévoles . sans . part transport en commun',
        ],
        [
          'déplacements . DT-bénévoles . sans . part deux roues',
          'déplacements . DT-bénévoles . sans . part deux roues',
        ],
      ],
    ),
    table(
      'DeplacementsDomicileTravailBenevoles.question2',
      ['DeplacementsDomicileTravailBenevoles.ModeTransport2', 'DeplacementsDomicileTravailBenevoles.DistanceMoyenne'],
      [
        ['déplacements . DT-bénévoles . sans . voiture', 'déplacements . DT-bénévoles . sans . voiture . distance'],
        ['déplacements . DT-bénévoles . sans . train', 'déplacements . DT-bénévoles . sans . train . distance'],
        ['déplacements . DT-bénévoles . sans . bus', 'déplacements . DT-bénévoles . sans . bus . distance'],
        [
          'déplacements . DT-bénévoles . sans . transports en commun',
          'déplacements . DT-bénévoles . sans . transports en commun . distance',
        ],
        [
          'déplacements . DT-bénévoles . sans . deux roues',
          'déplacements . DT-bénévoles . sans . deux roues . distance',
        ],
      ],
      'DeplacementsDomicileTravailBenevoles.description',
    ),
  ],
  DeplacementsDansLeCadreDUneMissionAssociativeSalaries: [
    // input('déplacements . DM-salariés . avec . émissions MEP . voiture'),
    // input('déplacements . DM-salariés . avec . émissions MEP . train'),
    // input('déplacements . DM-salariés . avec . émissions MEP . avion'),
    // input('déplacements . DM-salariés . avec . émissions MEP . transports en commun'),
    // input('déplacements . DM-salariés . avec . émissions MEP . deux roues'),
    table(
      'DeplacementsDansLeCadreDUneMissionAssociativeSalaries.question',
      [
        'DeplacementsDansLeCadreDUneMissionAssociativeSalaries.ModeTransport',
        'DeplacementsDansLeCadreDUneMissionAssociativeSalaries.DistanceMoyenne',
      ],
      [
        ['déplacements . DM-salariés . sans . voiture', 'déplacements . DM-salariés . sans . voiture . distance'],
        ['déplacements . DM-salariés . sans . train', 'déplacements . DM-salariés . sans . train . distance'],
        ['déplacements . DM-salariés . sans . bus', 'déplacements . DM-salariés . sans . bus . distance'],
        [
          'déplacements . DM-salariés . sans . transports en commun',
          'déplacements . DM-salariés . sans . transports en commun . distance',
        ],
        ['déplacements . DM-salariés . sans . deux roues', 'déplacements . DM-salariés . sans . deux roues . distance'],
        [
          'déplacements . DM-salariés . sans . avion . court courrier',
          'déplacements . DM-salariés . sans . avion . court courrier . distance',
        ],
        [
          'déplacements . DM-salariés . sans . avion . moyen courrier',
          'déplacements . DM-salariés . sans . avion . moyen courrier . distance',
        ],
        [
          'déplacements . DM-salariés . sans . avion . long courrier',
          'déplacements . DM-salariés . sans . avion . long courrier . distance',
        ],
      ],
    ),
  ],
  DeplacementsFabricationDesVehicules: [input('déplacements . fabrication . voitures . nombre')],
  TeletravailSalariesBenevoles: [input('télétravail . salariés . j'), input('télétravail . bénévoles . h')],
  Evenement: [
    mosaic('événement . mosaic alimentation', [
      'événement . mosaic alimentation . végétalien . nombre',
      'événement . mosaic alimentation . végétarien . nombre',
      'événement . mosaic alimentation . viande blanche . nombre',
      'événement . mosaic alimentation . viande rouge . nombre',
      'événement . mosaic alimentation . poisson gras . nombre',
      'événement . mosaic alimentation . poisson blanc . nombre',
      'événement . mosaic alimentation . repas moyen . nombre',
    ]),
    table(
      'Evenement.Deplacements',
      ['Evenement.ModeTransport', 'Evenement.DistanceParcourue'],
      [
        ['événement . déplacements . voiture', 'événement . déplacements . voiture'],
        ['événement . déplacements . train', 'événement . déplacements . train'],
        ['événement . déplacements . TGV', 'événement . déplacements . TGV'],
        ['événement . déplacements . bus', 'événement . déplacements . bus'],
        ['événement . déplacements . deux roues', 'événement . déplacements . deux roues'],
        ['événement . déplacements . transport en commun', 'événement . déplacements . transport en commun'],
        ['événement . déplacements . avion', 'événement . déplacements . avion'],
      ],
    ),
    group(
      'EvenementBooléen.question',
      [
        'événement . énergie . types . électricité présent',
        'événement . énergie . types . gaz présent',
        'événement . énergie . types . fioul présent',
      ],
      'EvenementBooléen.description',
    ),
    input('événement . énergie . électricité . consommation'),
    input('événement . énergie . gaz . consommation'),
    input('événement . énergie . fioul . consommation'),
    input('événement . hébergement . existant'),
    table(
      'Evenement.Hebergement',
      ['Evenement.TypeHebergement', 'Evenement.NombreNuitees'],
      [
        ['événement . hébergement . camping', 'événement . hébergement . camping . nombre de nuits'],
        ['événement . hébergement . hotel', 'événement . hébergement . hotel . nombre de nuits'],
      ],
    ),
  ],
} as const
