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
}

const TRANSPORT_EMISSION_FACTORS = {
  'Métro (Ile de France)': '43253',
  'RER et Transilien (Ile-de-France)': '43254',
  'Métro, tramway (agglomérations de 100 000 à 250 000 habitants)': '28150',
  'Métro, tramway (agglomérations de + de 250 000 habitants)': '28151',
  'Bus (agglomérations de - de 100 000 habitants)': '27998',
  'Bus (agglomérations de 100 000 à 250 000 habitants)': '27999',
  'Bus (agglomérations de + de 250 000 habitants)': '28000',
  'Vélo à assistance éléctrique': '28331',
  'Vélo classique': '134',
  Marche: '135',
  'Voiture gazole courte distance': '27984',
  'Voiture essence courte distance': '27983',
  'Voiture particulière/Entrée de gamme - Véhicule léger/Hybride rechargeable avec alimentation auxiliaire de puissance':
    '28015',
  'Voiture particulière/Entrée de gamme - Véhicule léger/Electrique': '28013',
  'Moto >250cm3 /Mixte': '27995',
  'Moto<250cm3/Mixte': '27992',
  'Trottinette électrique': '28329',
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
  'a-quand-remonte-la-derniere-renovation-importante': {
    depreciationPeriod: 10,
    linkDepreciationQuestionId: 'dans-le-cas-dun-agrandissement-quelle-est-la-surface-supplementaire-ajoutee',
  },
  'de-quel-type-de-renovation-sagi-t-il': {},
  'dans-le-cas-dun-agrandissement-quelle-est-la-surface-supplementaire-ajoutee': {
    emissionFactorImportedId: '20730',
    linkDepreciationQuestionId: 'a-quand-remonte-la-derniere-renovation-importante',
  },
  'le-batiment-est-il-partage-avec-une-autre-activite': {},
  'quelle-est-la-surface-totale-du-batiment': {},
  'le-cinema-dispose-t-il-dun-parking': {},
  'si-oui-de-combien-de-places': { emissionFactorImportedId: '26008', depreciationPeriod: 50 },
  // Equipe - attente de la fonctionnalité table
  '11-quel-est-le-rythme-de-travail-des-collaborateurs-du-cinema': { emissionFactorImportedId: '20682' },
  '12-quel-est-le-rythme-de-travail-des-collaborateurs-du-cinema': {},
  '13-quel-est-le-rythme-de-travail-des-collaborateurs-du-cinema': {
    emissionFactors: TRANSPORT_EMISSION_FACTORS,
  },
  // DeplacementsProfessionnels
  '11-decrivez-les-deplacements-professionnels-de-vos-collaborateurs': {},
  '12-decrivez-les-deplacements-professionnels-de-vos-collaborateurs': {},
  '13-decrivez-les-deplacements-professionnels-de-vos-collaborateurs': {},
  '14-decrivez-les-deplacements-professionnels-de-vos-collaborateurs': {
    emissionFactors: TRANSPORT_EMISSION_FACTORS,
  },
  '15-decrivez-les-deplacements-professionnels-de-vos-collaborateurs': {},
  '16-decrivez-les-deplacements-professionnels-de-vos-collaborateurs': {
    emissionFactors: {
      "tous types d'hôtel": '100',
      'hôtel 1*': '101',
      'hôtel 2*': '102',
      'hôtel 3*': '103',
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
  'reseaux-urbains-chaleurfroid': { emissionFactorImportedId: '' }, // Attente d'une fonctionnalité pour gérer les départements
  'bois-granules': { emissionFactorImportedId: '34942' },
  'votre-cinema-est-il-equipe-de-la-climatisation': { emissionFactorImportedId: '' },
  'le-cinema-dispose-t-il-d-un-ou-plusieurs-groupes-electrogenes': { emissionFactorImportedId: '20911' },
  'quelle-est-votre-consommation-annuelle-de-diesel': { emissionFactorImportedId: '14015' },
  // ActivitesDeBureau
  'quel-montant-avez-vous-depense-en-petites-fournitures-de-bureau': { emissionFactorImportedId: '20556' },
  'quel-montant-avez-vous-depense-en-services': { emissionFactorImportedId: '43545' },
  '10-pour-chacun-de-ces-equipements-informatiques-veuillez-indiquer': {
    isFixed: true,
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
  'avez-vous-deja-realise-une-enquete-mobilite-spectateur': {},
  '10-quelles-sont-les-distances-parcourues-au-total-sur-lannee-pour-chacun-des-modes-de-transport-suivants': {
    isFixed: true,
    emissionFactors: TRANSPORT_EMISSION_FACTORS,
  },
  'si-vous-souhaitez-realiser-une-enquete-mobilite-spectateur-vous-pouvez-ici-telecharger-un-modele-denquete-qui-vous-permettra-de-remplir-dici-quelques-semaines-les-informations-demandees':
    {},
  'si-vous-souhaitez-vous-identifier-a-des-profils-de-cinema-comparable-de-quel-type-de-cinema-votre-etablissement-se-rapproche-le-plus':
    {
      isSpecial: true,
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
  'vos-spectateurs-sont-ils-majoritairement-des-habitants-locaux-cest-a-dire-residant-a-lannee-dans-les-environs-ou-attirez-vous-aussi-une-part-non-negligeable-de-spectateurs-de-passage-dans-la-region-touristes-notamment':
    {
      isSpecial: true,
      emissionFactors: {
        TGV: '43256',
        'Voiture longue distance': '27983',
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
  'combien-dequipes-de-films-avez-vous-recu-en': { emissionFactorImportedId: '28130', isSpecial: true },
  'combien-de-nuits': { emissionFactorImportedId: '106' },
  'combien-dequipes-de-repas': { emissionFactorImportedId: '20682', isSpecial: true },
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
  'combien-de-films-recevez-vous-en-dematerialise-par-an': { isSpecial: true, emissionFactorImportedId: '142' },
  'combien-de-films-recevez-vous-sur-dcp-physique-par-an': { isSpecial: true, emissionFactorImportedId: '143' },
  'combien-de-donnees-stockez-vous-dans-un-cloud': { emissionFactorImportedId: '141' },
  'de-combien-de-disques-durs-disposez-vous': { emissionFactorImportedId: '140' },
  // Autre matériel
  'de-combien-de-lunettes-3d-disposez-vous': { emissionFactorImportedId: '139' },
  // Achats
  'selon-vous-en-moyenne-un-spectateur-achete': {
    isSpecial: true,
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
    },
  },
  // DechetsExceptionnels
  'quelle-quantite-de-materiel-technique-jetez-vous-par-an': { emissionFactorImportedId: '34620' },
  'quelle-quantite-de-lampes-xenon-jetez-vous-par-an': { emissionFactorImportedId: '107' },
  // MaterielDistributeurs
  '10-quelle-quantite-de-materiel-distributeurs-recevez-vous-en-moyenne-par-semaine': {
    isFixed: true,
    emissionFactors: {
      'Affiches 120x160': '125',
      'Affiches 40x60': '126',
      'PLV comptoir': '127',
      'PLV grand format': '128',
      Goodies: '129',
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
  'combien-de-newsletters-ont-ete-envoyees': { emissionFactorImportedId: '120' },
  'combien-de-caissons-d-affichage-dynamique-sont-presents-dans-le-cinema': { emissionFactorImportedId: '121' },
  'combien-d-ecrans-se-trouvent-dans-les-espaces-de-circulation': { emissionFactorImportedId: '27006' },
  'le-cinema-dispose-t-il-d-un-affichage-exterieur-si-oui-quelle-surface': { emissionFactorImportedId: '122' },
  // CaissesEtBornes
  'de-combien-de-bornes-de-caisse-libre-service-dispose-le-cinema': { emissionFactorImportedId: '123' },
  'de-combien-de-systemes-de-caisse-classique-dispose-le-cinema': { emissionFactorImportedId: '124' },
  // MaterielTechnique
  serveur: { emissionFactorImportedId: '20894' },
  'baies-de-disques': { emissionFactorImportedId: '20893' },
  // CommunicationDigitale (again)
  'ecrans-tv': { emissionFactorImportedId: '27006' },
}
