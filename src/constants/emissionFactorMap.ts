import {
  CLIMATISATION_QUESTION_ID,
  CONFECTIONERY_QUESTION_ID,
  CONFECTIONERY_SELECT_QUESTION_ID,
  INCREASE_SURFACE_QUESTION_ID,
  LONG_DISTANCE_QUESTION_ID,
  MOBILITY_DOWNLOAD_MODEL_QUESTION_ID,
  MOBILIY_SURVEY_QUESTION_ID,
  MOVIE_DCP_QUESTION_ID,
  MOVIE_DEMAT_QUESTION_ID,
  MOVIE_TEAM_QUESTION_ID,
  NEWSLETTER_QUESTION_ID,
  NEWSLETTER_RECEIVER_COUNT_QUESTION_ID,
  RENOVATION_QUESTION_ID,
  RENOVATION_SELECTION_QUESTION_ID,
  RESEAU_CHALLEUR_QUESTION_ID,
  RESEAU_FROID_QUESTION_ID,
  SERVICES_QUESTION_ID,
  SHARED_ACTIVITY_QUESTION_ID,
  SHORT_DISTANCE_QUESTION_ID,
  SPECTATOR_SHORT_DISTANCE_DETAILS_QUESTION_ID,
  XENON_LAMPS_QUESTION_ID,
} from './questions'

type CinemaTransportProfile = {
  percentage: number
  averageDistance: number
  emissionFactorId: string
}

type CinemaProfileConfig = Record<string, CinemaTransportProfile>

type LongDistanceConfig = {
  longDistancePercentage: number
  shortDistancePercentage: number
}

export type ConditionalRule = {
  idIntern: string
  expectedAnswers: string[]
}

export type EmissionFactorInfo = {
  emissionFactorImportedId?: string | undefined
  depreciationPeriod?: number
  linkDepreciationQuestionId?: string
  emissionFactors?: Record<string, string>
  isFixed?: boolean
  isSpecial?: boolean
  weights?: Record<string, number>
  shortDistanceProfiles?: Record<string, CinemaProfileConfig>
  longDistanceProfiles?: Record<string, LongDistanceConfig>
  relatedQuestions?: string[]
  conditionalRules?: ConditionalRule[]
}

const SHORT_DISTANCE_TRANSPORT_EMISSION_FACTORS = {
  'RER et Transilien': '43254',
  'Métro, tramway': '28150',
  Bus: '27999',
  'Vélo électrique': '28331',
  'Vélo classique': '134',
  Marche: '135',
  'Voiture diesel': '27984',
  'Voiture essence': '27983',
  'Voiture hybride': '28015',
  'Voiture électrique': '28013',
  Moto: '27995',
  Scooter: '27992',
  'Trottinette électrique': '28329',
}

const LONG_DISTANCE_TRANSPORT_EMISSION_FACTORS = {
  'RER et Transilien': '43254',
  'Métro, tramway': '28150',
  Bus: '27999',
  'Vélo électrique': '28331',
  'Voiture diesel': '27978',
  'Voiture essence': '27977',
  'Voiture hybride': '28015',
  'Voiture électrique': '28013',
  Moto: '27995',
  Scooter: '27992',
  TGV: '43256',
  'Avion moyen courrier': '28132',
}

export const emissionFactorMap: Record<string, EmissionFactorInfo> = {
  /**
   * TODO use date to calculate depreciation period
   * TODO match emissionFactorImportedId with idIntern
   */
  // Batiment
  'quelle-est-la-surface-plancher-du-cinema': {
    emissionFactorImportedId: '20730',
    linkDepreciationQuestionId: 'quand-le-batiment-a-t-il-ete-construit',
  },
  'quand-le-batiment-a-t-il-ete-construit': {
    depreciationPeriod: 50,
    linkDepreciationQuestionId: 'quelle-est-la-surface-plancher-du-cinema',
  },
  'de-quel-type-de-renovation-sagi-t-il': {},
  [INCREASE_SURFACE_QUESTION_ID]: {
    emissionFactorImportedId: '20730',
    conditionalRules: [
      {
        idIntern: RENOVATION_SELECTION_QUESTION_ID,
        expectedAnswers: ['Agrandissement - extension'],
      },
    ],
  },
  [RENOVATION_QUESTION_ID]: {
    emissionFactorImportedId: '43340',
    isSpecial: true,
    depreciationPeriod: 10,
    conditionalRules: [
      {
        idIntern: RENOVATION_SELECTION_QUESTION_ID,
        expectedAnswers: [
          'Rénovation totale (hors agrandissement)',
          'Autres travaux importants (par ex : changement moquette, ravalement, peinture etc)',
        ],
      },
    ],
  },
  'quelle-est-la-surface-totale-du-batiment': {
    conditionalRules: [
      {
        idIntern: SHARED_ACTIVITY_QUESTION_ID,
        expectedAnswers: ['11-Oui'],
      },
    ],
  },
  'le-cinema-dispose-t-il-dun-parking': {},
  'si-oui-de-combien-de-places': {
    emissionFactorImportedId: '26008',
    depreciationPeriod: 50,
    conditionalRules: [
      {
        idIntern: 'le-cinema-dispose-t-il-dun-parking',
        expectedAnswers: ['11-Oui'],
      },
    ],
  },
  // Equipe - attente de la fonctionnalité table
  '11-quel-est-le-rythme-de-travail-des-collaborateurs-du-cinema': {},
  '12-quel-est-le-rythme-de-travail-des-collaborateurs-du-cinema': { emissionFactorImportedId: '20682' },
  '13-quel-est-le-rythme-de-travail-des-collaborateurs-du-cinema': {},
  '14-quel-est-le-rythme-de-travail-des-collaborateurs-du-cinema': {
    emissionFactors: SHORT_DISTANCE_TRANSPORT_EMISSION_FACTORS,
  },
  // DeplacementsProfessionnels
  '11-decrivez-les-deplacements-professionnels-de-vos-collaborateurs': {},
  '12-decrivez-les-deplacements-professionnels-de-vos-collaborateurs': {},
  '13-decrivez-les-deplacements-professionnels-de-vos-collaborateurs': {},
  '14-decrivez-les-deplacements-professionnels-de-vos-collaborateurs': {
    emissionFactors: LONG_DISTANCE_TRANSPORT_EMISSION_FACTORS,
  },
  '15-decrivez-les-deplacements-professionnels-de-vos-collaborateurs': {},
  '16-decrivez-les-deplacements-professionnels-de-vos-collaborateurs': {
    emissionFactors: {
      appartement: '100',
      'hôtel 1*': '101',
      'hôtel 2*': '102',
      'hôtel 4*': '104',
      'hôtel 5*': '105',
      nuitée: '106',
    },
  },
  '17-decrivez-les-deplacements-professionnels-de-vos-collaborateurs': {},
  // Energie
  'quelles-etaient-les-consommations-energetiques-du-cinema': { emissionFactorImportedId: '15591' },
  gaz: { emissionFactorImportedId: '37138' },
  fuel: { emissionFactorImportedId: '14086' },
  [RESEAU_CHALLEUR_QUESTION_ID]: { emissionFactorImportedId: '37089' },
  [RESEAU_FROID_QUESTION_ID]: { emissionFactorImportedId: '37090' },
  'bois-granules': { emissionFactorImportedId: '34942' },
  [CLIMATISATION_QUESTION_ID]: { emissionFactorImportedId: '145', isSpecial: true },
  'le-cinema-dispose-t-il-d-un-ou-plusieurs-groupes-electrogenes': { emissionFactorImportedId: '20911' },
  'quelle-est-votre-consommation-annuelle-de-diesel': { emissionFactorImportedId: '14015' },
  // ActivitesDeBureau
  'quel-montant-avez-vous-depense-en-petites-fournitures-de-bureau': { emissionFactorImportedId: '20556' },
  [SERVICES_QUESTION_ID]: { emissionFactorImportedId: '43545', isSpecial: true },
  '10-pour-chacun-de-ces-equipements-informatiques-veuillez-indiquer': {
    depreciationPeriod: 4,
    emissionFactors: {
      'Ordinateurs fixes': '27003',
      'Ordinateurs portables': '27002',
      Photocopieurs: '20591',
      Imprimantes: '27027',
      'Téléphones fixes': '20614',
      'Téléphones portables': '27010',
      Tablettes: '27007',
    },
  },
  [SPECTATOR_SHORT_DISTANCE_DETAILS_QUESTION_ID]: {
    isFixed: true,
    emissionFactors: SHORT_DISTANCE_TRANSPORT_EMISSION_FACTORS,
    conditionalRules: [
      {
        idIntern: MOBILIY_SURVEY_QUESTION_ID,
        expectedAnswers: ['11-Oui et je peux rentrer les résultats'],
      },
    ],
  },
  [MOBILITY_DOWNLOAD_MODEL_QUESTION_ID]: {
    conditionalRules: [
      {
        idIntern: MOBILIY_SURVEY_QUESTION_ID,
        expectedAnswers: ["12-Non mais je voudrais le faire pour estimer l'impact du cinéma"],
      },
    ],
  },
  [SHORT_DISTANCE_QUESTION_ID]: {
    isSpecial: true,
    relatedQuestions: [LONG_DISTANCE_QUESTION_ID],
    conditionalRules: [
      {
        idIntern: MOBILIY_SURVEY_QUESTION_ID,
        expectedAnswers: ["13-Non mais je préfère m'identifier dans des profils de cinéma comparables"],
      },
    ],
    shortDistanceProfiles: {
      'Les spectateurs parcourent des distances très courtes pour venir au cinéma (moins de 10km aller-retour). Très peu viennent en voiture (- de 10%) et la grande majorité des spectateurs vient à pied ou en transports en commun':
        {
          Voiture: { percentage: 13, averageDistance: 5.98, emissionFactorId: '27983' },
          'Transports en commun (bus, métro, tram)': {
            percentage: 28,
            averageDistance: 7.41,
            emissionFactorId: '28150',
          },
          'Moto / scooter': { percentage: 0, averageDistance: 2.31, emissionFactorId: '27995' },
          'Train / RER': { percentage: 2, averageDistance: 9.59, emissionFactorId: '43254' },
          'Trottinette électrique': { percentage: 0, averageDistance: 3.33, emissionFactorId: '28329' },
        },
      "Les spectateurs parcourent autour de 10 km aller-retour pour se rendre au cinéma. Il s'agit essentiellement d'un public de proximité venant en grande partie en voiture. Autour de 25% d'entre eux viennent à pied.":
        {
          Voiture: { percentage: 69, averageDistance: 10.77, emissionFactorId: '27983' },
          'Transports en commun (bus, métro, tram)': {
            percentage: 2,
            averageDistance: 7.41,
            emissionFactorId: '28150',
          },
          'Moto / scooter': { percentage: 2, averageDistance: 6.42, emissionFactorId: '27995' },
          'Train / RER': { percentage: 0, averageDistance: 5.36, emissionFactorId: '43254' },
          'Trottinette électrique': { percentage: 0, averageDistance: 0, emissionFactorId: '28329' },
        },
      "Les spectateurs parcourent autour de 20-25 km aller-retour pour se rendre au cinéma. Il s'agit essentiellement d'un public de proximité venant en grande partie en voiture. Autour de 25% d'entre eux viennent à pied.":
        {
          Voiture: { percentage: 63, averageDistance: 24.36, emissionFactorId: '27983' },
          'Transports en commun (bus, métro, tram)': {
            percentage: 5,
            averageDistance: 25.84,
            emissionFactorId: '28150',
          },
          'Moto / scooter': { percentage: 1, averageDistance: 9.91, emissionFactorId: '27995' },
          'Train / RER': { percentage: 0, averageDistance: 3.69, emissionFactorId: '43254' },
          'Trottinette électrique': { percentage: 0, averageDistance: 3.76, emissionFactorId: '28329' },
        },
      'Plus de 80% des spectateurs viennent en voiture. Pas ou peu viennent en transports en commun, peu viennent à pied. La distance moyenne parcourue est autour de 15 km aller-retour':
        {
          Voiture: { percentage: 89, averageDistance: 15.84, emissionFactorId: '27983' },
          'Transports en commun (bus, métro, tram)': {
            percentage: 2,
            averageDistance: 10.27,
            emissionFactorId: '28150',
          },
          'Moto / scooter': { percentage: 0, averageDistance: 4.6, emissionFactorId: '27995' },
          'Train / RER': { percentage: 0, averageDistance: 24.58, emissionFactorId: '43254' },
          'Trottinette électrique': { percentage: 0, averageDistance: 1.97, emissionFactorId: '28329' },
        },
      "Le cinéma n'est accessible qu'en voiture": {
        Voiture: { percentage: 100, averageDistance: 18.73, emissionFactorId: '27983' },
        'Transports en commun (bus, métro, tram)': { percentage: 0, averageDistance: 0, emissionFactorId: '28150' },
        'Moto / scooter': { percentage: 0, averageDistance: 0, emissionFactorId: '27995' },
        'Train / RER': { percentage: 0, averageDistance: 0, emissionFactorId: '43254' },
        'Trottinette électrique': { percentage: 0, averageDistance: 0, emissionFactorId: '28329' },
      },
    },
  },
  [LONG_DISTANCE_QUESTION_ID]: {
    isSpecial: true,
    relatedQuestions: [SHORT_DISTANCE_QUESTION_ID],
    conditionalRules: [
      {
        idIntern: MOBILIY_SURVEY_QUESTION_ID,
        expectedAnswers: ["13-Non mais je préfère m'identifier dans des profils de cinéma comparables"],
      },
    ],
    emissionFactors: {
      TGV: '43256',
      'Voiture longue distance': '27977',
    },
    longDistanceProfiles: {
      "Le cinéma est situé dans une zone touristique et 80% ou + des spectateurs ne résident pas à proximité du cinéma à l'année":
        {
          longDistancePercentage: 80,
          shortDistancePercentage: 20,
        },
      'Le cinéma est situé dans une ville de destination de week-end et / ou station balnéaire attirant environ 25% de spectateurs "non-locaux"':
        {
          longDistancePercentage: 25,
          shortDistancePercentage: 75,
        },
      'Le cinéma accueille majoritairement des spectateurs locaux': {
        longDistancePercentage: 0,
        shortDistancePercentage: 100,
      },
    },
  },
  next: {},
  'quel-est-le-profil-auquel-vous-pouvez-identifier-le-plus-votre-cinema': {},
  // Equipes recus
  [MOVIE_TEAM_QUESTION_ID]: {
    emissionFactors: { transport: '43256', meal: '20682' },
    isSpecial: true,
  },
  // Matériel technique
  '10-decrivez-les-differentes-salles-du-cinema': {},
  '102-decrivez-les-differentes-salles-du-cinema': {
    depreciationPeriod: 10,
    emissionFactors: {
      'Projecteur Xénon': '107',
      'Projecteur Laser': '108',
      'Projecteur 35 mm': '109',
    },
  },
  '104-decrivez-les-differentes-salles-du-cinema': {
    depreciationPeriod: 10,
    emissionFactors: {
      'Ecran 2D': '110',
      'Ecran 3D': '111',
    },
  },
  '107-decrivez-les-differentes-salles-du-cinema': {
    depreciationPeriod: 10,
    emissionFactors: {
      'Fauteuils classiques': '112',
      'Fauteuils 4DX': '113',
    },
  },
  '110-decrivez-les-differentes-salles-du-cinema': {
    depreciationPeriod: 10,
    emissionFactors: {
      'Son Stéréo': '114',
      'Dolby 5.1': '115',
      'Dolby 7.1': '116',
      'Dolby Atmos': '117',
      IMAX: '118',
      'Auro 3D / Ice': '119',
      'DTS : X': '120',
      THX: '121',
    },
  },
  '11-comment-stockez-vous-les-films': { emissionFactorImportedId: '20894' },
  '12-comment-stockez-vous-les-films': { emissionFactorImportedId: '20893' },
  [MOVIE_DEMAT_QUESTION_ID]: { isSpecial: true, emissionFactorImportedId: '142' },
  [MOVIE_DCP_QUESTION_ID]: { isSpecial: true, emissionFactorImportedId: '143' },
  'combien-de-donnees-stockez-vous-dans-un-cloud': { emissionFactorImportedId: '141' },
  'de-combien-de-disques-durs-disposez-vous': { emissionFactorImportedId: '140' },
  // Autre matériel
  'de-combien-de-lunettes-3d-disposez-vous': { emissionFactorImportedId: '139' },
  // Achats
  [CONFECTIONERY_QUESTION_ID]: {
    isSpecial: true,
    conditionalRules: [
      {
        idIntern: CONFECTIONERY_SELECT_QUESTION_ID,
        expectedAnswers: ['11-Oui'],
      },
    ],
    emissionFactors: {
      'Un peu de confiseries et de boissons (~30g)': '136',
      'Une part standard de confiseries et de boissons (~120g)': '137',
      'Une part significative de confiseries et de boissons (~200g)': '138',
    },
  },
  // Fret
  'quelle-est-la-distance-entre-votre-cinema-et-votre-principal-fournisseur': { emissionFactorImportedId: '28026' },
  // Electromenager
  '10-pour-chacun-de-ces-equipements-electromenagers-veuillez-renseigner': {
    isFixed: true,
    emissionFactors: {
      Réfrigérateurs: '26976',
      Congélateurs: '26978',
      Warmers: '26986',
      'Distributeurs snacks / boisson': '26976',
    },
    depreciationPeriod: 5,
  },
  // DechetsOrdinaires
  '10-veuillez-renseigner-les-dechets-generes-par-semaine': {
    isFixed: true,
    emissionFactors: {
      'Ordures ménagères (déchets non triés / sans filière)': '34654',
      'Emballages et papier (plastique, métal, papier et carton)': '34486',
      'Biodéchets (restes alimentaires)': '22040',
      'Déchets verre': '34478',
    },
  },
  // DechetsExceptionnels
  'quelle-quantite-de-materiel-technique-jetez-vous-par-an': { emissionFactorImportedId: '34620' },
  [XENON_LAMPS_QUESTION_ID]: { emissionFactorImportedId: '144', isSpecial: true, weights: { default: 0.86 } },
  // MaterielDistributeurs
  '10-quelle-quantite-de-materiel-distributeurs-recevez-vous-en-moyenne-par-semaine': {
    isFixed: true,
    emissionFactors: {
      'Affiches 120x160': '125',
      'Affiches 40x60': '126',
      'PLV comptoir': '127',
      'PLV grand format': '128',
    },
    weights: {
      'Affiches 120x160': 0.22,
      'Affiches 40x60': 0.027,
      'PLV comptoir': 0.5,
      'PLV grand format': 3.5,
    },
  },
  // MaterielCinema
  '10-quelle-quantite-de-materiel-produisez-vous-chaque-mois': {
    isFixed: true,
    emissionFactors: {
      Programme: '130',
      Affiches: '126',
      Flyers: '133',
    },
    weights: {
      Programme: 0.005,
      Affiches: 0.027,
      Flyers: 0.0042,
    },
  },
  // CommunicationDigitale
  [NEWSLETTER_QUESTION_ID]: {
    emissionFactorImportedId: '120',
    isSpecial: true,
    relatedQuestions: [NEWSLETTER_RECEIVER_COUNT_QUESTION_ID],
  },
  [NEWSLETTER_RECEIVER_COUNT_QUESTION_ID]: {
    emissionFactorImportedId: '120',
    isSpecial: true,
    relatedQuestions: [NEWSLETTER_QUESTION_ID],
  },
  'combien-de-caissons-daffichage-dynamique-sont-presents-dans-le-cinema': { emissionFactorImportedId: '121' },
  'combien-decrans-se-trouvent-dans-les-espaces-de-circulation': { emissionFactorImportedId: '27006' },
  'le-cinema-dispose-t-il-dun-affichage-exterieur-si-oui-quelle-surface': { emissionFactorImportedId: '122' },
  // CaissesEtBornes
  'de-combien-de-bornes-de-caisse-libre-service-dispose-le-cinema': { emissionFactorImportedId: '123' },
  'de-combien-de-systemes-de-caisse-classique-dispose-le-cinema': { emissionFactorImportedId: '124' },
  // MaterielTechnique
  serveur: { emissionFactorImportedId: '20894' },
  'baies-de-disques': { emissionFactorImportedId: '20893' },
  // CommunicationDigitale (again)
  'ecrans-tv': { emissionFactorImportedId: '27006' },
}
