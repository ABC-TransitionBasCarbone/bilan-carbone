import { CutSituation } from '@/environments/cut/publicodes/types'
import { QuestionType } from '@prisma/client'
import { allQuestionsIdIntern } from './allQuestionsIdIntern'

export type InternQuestionId = (typeof allQuestionsIdIntern)[number]
export type CutSituationKey = keyof CutSituation

export type QuestionsPublicodesMappingType = Partial<
  Record<
    QuestionType,
    Partial<
      Record<
        InternQuestionId,
        CutSituationKey | Record<string, CutSituationKey> | [CutSituationKey, Record<string, string>]
      >
    >
  >
>

export const questionsPublicodesMapping: QuestionsPublicodesMappingType = {
  NUMBER: {
    'quelle-est-la-surface-totale-du-batiment': 'fonctionnement . bâtiment . autre activité . surface',
    'reseaux-urbains-chaleur': 'fonctionnement . énergie . réseau de chaleur . consommation',
    'de-combien-de-bornes-de-caisse-libre-service-dispose-le-cinema':
      'billetterie et communication . caisses et bornes . caisses libre service . nombre',
    'quelle-est-la-surface-plancher-du-cinema': 'fonctionnement . bâtiment . construction . surface',
    'quel-est-le-montant-des-depenses-liees-a-ces-travaux-de-renovation':
      'fonctionnement . bâtiment . rénovation . empreinte travaux . montant',
    'quelles-etaient-les-consommations-energetiques-du-cinema': 'fonctionnement . énergie . électricité . consommation',
    'quelle-est-la-distance-entre-votre-cinema-et-votre-principal-fournisseur':
      'confiseries et boissons . fret . distance',
    'le-cinema-dispose-t-il-dun-affichage-exterieur-si-oui-quelle-surface':
      'billetterie et communication . communication digitale . affichage extérieur . surface',
    'combien-de-caissons-daffichage-dynamique-sont-presents-dans-le-cinema':
      'billetterie et communication . communication digitale . affichage dynamique . nombre',
    gaz: 'fonctionnement . énergie . gaz . consommation',
    'quelle-quantite-de-materiel-technique-jetez-vous-par-an':
      'déchets . exceptionnels . matériel technique . quantité',
    'combien-decrans-se-trouvent-dans-les-espaces-de-circulation':
      'billetterie et communication . communication digitale . écrans . nombre',
    'de-combien-de-systemes-de-caisse-classique-dispose-le-cinema':
      'billetterie et communication . caisses et bornes . caisse classique . nombre',
    'combien-de-donnees-stockez-vous-dans-un-cloud': 'salles et cabines . matériel technique . cloud . stockage',
    fuel: 'fonctionnement . énergie . fioul . consommation',
    'de-combien-de-disques-durs-disposez-vous': 'salles et cabines . matériel technique . disques durs . nombre',
    'quelle-quantite-de-lampes-xenon-jetez-vous-par-an': 'déchets . exceptionnels . lampe xenon . nombre',
    //TODO vérifier si chaleur ou froid
    'reseaux-urbains-chaleurfroid': 'fonctionnement . énergie . réseau de chaleur . consommation',
    'combien-dequipes-de-films-avez-vous-recu-en': 'tournées avant premières . équipes reçues . nombre équipes',
    'bois-granules': 'fonctionnement . énergie . granulés . consommation',
    'de-combien-de-lunettes-3d-disposez-vous': 'salles et cabines . autre matériel . lunettes 3D . nombre',
    'quelle-est-votre-consommation-annuelle-de-diesel':
      'fonctionnement . énergie . groupes électrogènes . consommation',
    'dans-le-cas-dun-agrandissement-quelle-est-la-surface-supplementaire-ajoutee':
      'fonctionnement . bâtiment . rénovation . empreinte extension . surface',
    'en-moyenne-a-combien-de-personnes-sont-adressees-ces-newsletters':
      'billetterie et communication . communication digitale . newsletters . destinataires',
    'combien-de-newsletters-ont-ete-envoyees':
      'billetterie et communication . communication digitale . newsletters . nombre',
    'combien-de-films-recevez-vous-en-dematerialise-par-an':
      'salles et cabines . matériel technique . films . nombre films dématérialisés',
    'quel-montant-avez-vous-depense-en-services': 'fonctionnement . activités de bureau . services . montant',
    'quel-montant-avez-vous-depense-en-petites-fournitures-de-bureau':
      'fonctionnement . activités de bureau . petites fournitures . montant',
    'si-oui-de-combien-de-places': 'fonctionnement . bâtiment . parking . nombre de places',
  },
  TEXT: {
    'quand-le-batiment-a-t-il-ete-construit': 'fonctionnement . bâtiment . construction . année de construction',
  },
  QCU: {
    'le-cinema-dispose-t-il-dun-parking': 'fonctionnement . bâtiment . parking présent',
    'vendez-vous-des-boissons-et-des-confiseries': 'confiseries et boissons . achats . vente sur place',
    'le-batiment-est-il-partage-avec-une-autre-activite': 'fonctionnement . bâtiment . est partagé',
    'votre-cinema-est-il-equipe-de-la-climatisation': 'fonctionnement . énergie . est équipé climatisation',
  },
  QCM: {
    'de-quel-type-de-renovation-sagit-il': {
      'Rénovation totale (hors agrandissement)': 'fonctionnement . bâtiment . rénovation . type . rénovation totale',
      'Agrandissement - extension': 'fonctionnement . bâtiment . rénovation . type . extension',
      'Autres travaux importants (par ex : changement moquette, ravalement, peinture etc)':
        'fonctionnement . bâtiment . rénovation . type . autres travaux importants',
      "Je n'ai pas réalisé ces rénovations durant les dix dernières années":
        'fonctionnement . bâtiment . rénovation . type . aucun',
    },
  },
  SELECT: {
    'si-vous-souhaitez-vous-identifier-a-des-profils-de-cinema-comparable-de-quel-type-de-cinema-votre-etablissement-se-rapproche-le-plus':
      [
        'mobilité spectateurs . résultat estimé . profil établissement',
        {
          'Les spectateurs parcourent des distances très courtes pour venir au cinéma (moins de 10km aller-retour). Très peu viennent en voiture (- de 10%) et la grande majorité des spectateurs vient à pied ou en transports en commun':
            'distances courtes',
          "Les spectateurs parcourent autour de 10 km aller-retour pour se rendre au cinéma. Il s'agit essentiellement d'un public de proximité venant en grande partie en voiture. Autour de 25% d'entre eux viennent à pied.":
            'distances moyennes',
          "Les spectateurs parcourent autour de 20-25 km aller-retour pour se rendre au cinéma. Il s'agit essentiellement d'un public de proximité venant en grande partie en voiture. Autour de 25% d'entre eux viennent à pied.":
            'distances longues',
          'Plus de 80% des spectateurs viennent en voiture. Pas ou peu viennent en transports en commun, peu viennent à pied. La distance moyenne parcourue est autour de 15 km aller-retour':
            'majoritairement en voiture',
          "Le cinéma n'est accessible qu'en voiture": 'uniquement accessible en voiture',
        },
      ],
    'le-cinema-dispose-t-il-dun-ou-plusieurs-groupes-electrogenes': [
      'fonctionnement . énergie . équipement groupes électrogènes',
      {
        '11-Oui et je l’utilise plusieurs fois par an': 'utilisation régulière',
        '12-Oui mais je ne l’utilise jamais': 'équipé sans utilisation',
        '12-Non': 'aucun',
      },
    ],
    'selon-vous-en-moyenne-un-spectateur-achete': [
      'confiseries et boissons . achats . achat type',
      {
        'Un peu de confiseries et de boissons (~30g)': 'un peu',
        'Une part standard de confiseries et de boissons (~120g)': 'standard',
        'Une part significative de confiseries et de boissons (~200g)': 'significatif',
      },
    ],
    'avez-vous-deja-realise-une-enquete-mobilite-spectateurs': [
      'mobilité spectateurs . précision',
      {
        '11-Oui et je peux rentrer les résultats': 'résultat précis',
        "12-Non mais je voudrais le faire pour estimer l'impact du cinéma": 'besoin',
        "13-Non mais je préfère m'identifier dans des profils de cinéma comparables": 'estimation',
      },
    ],
    'vos-spectateurs-sont-ils-majoritairement-des-habitants-locaux-cest-a-dire-residant-a-lannee-dans-les-environs-ou-attirez-vous-aussi-une-part-non-negligeable-de-spectateurs-de-passage-dans-la-region-touristes-notamment':
      [
        'mobilité spectateurs . résultat estimé . proximité spectateurs',
        {
          "Le cinéma est situé dans une zone touristique et 80% ou + des spectateurs ne résident pas à proximité du cinéma à l'année":
            'zone très touristique',
          'Le cinéma est situé dans une ville de destination de week-end et / ou station balnéaire attirant environ 25% de spectateurs "non-locaux"':
            'zone moyennement touristique',
          'Le cinéma accueille majoritairement des spectateurs locaux': 'majoritairement locaux',
        },
      ],
    '102-decrivez-les-differentes-salles-du-cinema': [
      'salles et cabines . matériel technique . salle . projecteur . type',
      {
        'Projecteur Xénon': 'xénon',
        'Projecteur Laser': 'laser',
      },
    ],
    '11-quelle-quantite-de-materiel-distributeurs-recevez-vous-en-moyenne-par-semaine': [
      'billetterie et communication . matériel distributeurs . affiches',
      {
        'Affiches 120x160': 'affiches 120x160',
        'Affiches 40x60': 'affiches 40x60',
      },
    ],
    '14-decrivez-les-deplacements-professionnels-de-vos-collaborateurs': [
      'fonctionnement . déplacements pro . déplacement type . transport . moyen de transport',
      {
        'RER et Transilien': 'RER et transilien',
        'Métro, tramway': 'métro ou tram',
        Bus: 'bus',
        'Vélo électrique': 'vélo électrique',
        'Vélo classique': 'vélo classique',
        Marche: 'marche',
        'Voiture diesel': 'voiture diesel',
        'Voiture essence': 'voiture essence',
        'Voiture hybride': 'voiture hybride',
        'Voiture électrique': 'voiture électrique',
        Moto: 'moto',
        Scooter: 'scooter',
        TGV: 'TGV',
        'Trottinette électrique': 'trottinette électrique',
        'Avion moyen courrier': 'avion moyen courrier',
      },
    ],
    '11-pour-chacun-de-ces-equipements-informatiques-veuillez-indiquer': [
      'fonctionnement . activités de bureau . informatique . équipement',
      {
        'Ordinateurs fixes': 'ordinateurs fixes',
        'Ordinateurs portables': 'ordinateurs portables',
        Photocopieurs: 'photocopieurs',
        Imprimantes: 'imprimantes',
        'Téléphones fixes': 'téléphones fixes',
        'Téléphones portables': 'téléphones portables',
        Tablettes: 'tablettes',
      },
    ],
    '110-decrivez-les-differentes-salles-du-cinema': [
      'salles et cabines . matériel technique . salle . système son . type',
      {
        'Son Stéréo': 'stéréo',
        'Dolby 5.1': 'dolby 51',
        'Dolby 7.1': 'dolby 71',
        'Dolby Atmos': 'dolby atmos',
        IMAX: 'imax',
        'Auro 3D / Ice': 'auro 3dIce',
        'DTS : X': 'dtsx',
        // visblement, l'option n'est plus possible
        THX: '',
      },
    ],
    '11-quelle-quantite-de-materiel-distributeurs-recevez-vous-en-moyenne-par-mois': [
      'billetterie et communication . matériel distributeurs . PLV',
      {
        'PLV comptoir': 'PLV comptoir',
        'PLV grand format': 'PLV grand format',
      },
    ],
    '11-quelle-quantite-de-materiel-produisez-vous-chaque-mois': [
      'billetterie et communication . matériel cinéma . production',
      {
        Affiches: 'affiches',
        Programmes: 'programme',
        Flyers: 'flyers',
      },
    ],
    '16-decrivez-les-deplacements-professionnels-de-vos-collaborateurs': [
      'fonctionnement . déplacements pro . déplacement type . type hébergement',
      {
        appartement: 'appartement',
        'hôtel 1*': 'hotel 1 étoile',
        'hôtel 2*': 'hotel 2 étoiles',
        'hôtel 3*': 'hotel 3 étoiles',
        'hôtel 4*': 'hotel 4 étoiles',
        'hôtel 5*': 'hotel 5 étoiles',
      },
    ],
    '104-decrivez-les-differentes-salles-du-cinema': [
      'salles et cabines . matériel technique . salle . écran . type',
      {
        'Ecran 2D': 'écran 2D',
        'Ecran 3D': 'écran 3D',
      },
    ],
  },
}
