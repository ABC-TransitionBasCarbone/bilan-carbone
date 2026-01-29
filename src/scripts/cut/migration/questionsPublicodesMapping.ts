import { CutSituation } from '@/environments/cut/publicodes/types'
import { allQuestionsIdIntern } from './allQuestionsIdIntern'

export type InternQuestionId = (typeof allQuestionsIdIntern)[number]
export type CutSituationKey = keyof CutSituation
export type QuestionsPublicodesMappingType = {
  NUMBER: Partial<Record<InternQuestionId | `${InternQuestionId}-${string}`, CutSituationKey>>
  TEXT: Partial<Record<InternQuestionId | `${InternQuestionId}-${string}`, CutSituationKey>>
  QCU: Partial<Record<InternQuestionId, CutSituationKey>>
  QCM: Partial<Record<InternQuestionId, Record<string, CutSituationKey>>>
  SELECT: Partial<Record<InternQuestionId, [CutSituationKey, Record<string, string>]>>
  TABLE: Partial<Record<InternQuestionId, 'TABLEAU' | ['LISTE', CutSituationKey]>>
}

export const questionsPublicodesMapping: QuestionsPublicodesMappingType = {
  NUMBER: {
    'quelle-est-la-surface-totale-du-batiment': 'fonctionnement . bâtiment . autre activité . surface',
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
    'reseaux-urbains-chaleur': 'fonctionnement . énergie . réseau de chaleur . consommation',
    'reseaux-urbains-froid': 'fonctionnement . énergie . réseau de froid . consommation',
    'reseaux-urbains-chaleurfroid': 'fonctionnement . énergie . réseau de froid . consommation',
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
    '105-decrivez-les-differentes-salles-du-cinema':
      'salles et cabines . matériel technique . salle . écran . surface écran',
    '13-quel-est-le-rythme-de-travail-des-collaborateurs-du-cinema':
      'fonctionnement . équipe . collaborateur type . transport . distance',
    '12-decrivez-les-deplacements-professionnels-de-vos-collaborateurs':
      'fonctionnement . déplacements pro . déplacement type . transport . distance',
    '17-decrivez-les-deplacements-professionnels-de-vos-collaborateurs':
      'fonctionnement . déplacements pro . déplacement type . nombre de nuitées',
    '15-decrivez-les-deplacements-professionnels-de-vos-collaborateurs':
      'fonctionnement . déplacements pro . déplacement type . nombre occurences',
    '13-decrivez-les-deplacements-professionnels-de-vos-collaborateurs':
      'fonctionnement . déplacements pro . déplacement type . nombre participants',
    '12-quel-est-le-rythme-de-travail-des-collaborateurs-du-cinema':
      'fonctionnement . équipe . collaborateur type . nombre de jours par semaine',
    '12-veuillez-renseigner-les-dechets-generes-par-semaine-ordures_ménagères':
      'déchets . ordinaires . ordures ménagères . nombre bennes',
    '12-veuillez-renseigner-les-dechets-generes-par-semaine-emballages_et_papier':
      'déchets . ordinaires . emballages et papier . nombre bennes',
    '12-veuillez-renseigner-les-dechets-generes-par-semaine-biodéchets':
      'déchets . ordinaires . biodéchets . nombre bennes',
    '12-veuillez-renseigner-les-dechets-generes-par-semaine-verre': 'déchets . ordinaires . verre . nombre bennes',
    '13-veuillez-renseigner-les-dechets-generes-par-semaine-ordures_ménagères':
      'déchets . ordinaires . ordures ménagères . taille benne',
    '13-veuillez-renseigner-les-dechets-generes-par-semaine-emballages_et_papier':
      'déchets . ordinaires . emballages et papier . taille benne',
    '13-veuillez-renseigner-les-dechets-generes-par-semaine-biodéchets':
      'déchets . ordinaires . biodéchets . taille benne',
    '13-veuillez-renseigner-les-dechets-generes-par-semaine-verre': 'déchets . ordinaires . verre . taille benne',
    '14-veuillez-renseigner-les-dechets-generes-par-semaine-ordures_ménagères':
      'déchets . ordinaires . ordures ménagères . fréquence ramassage',
    '14-veuillez-renseigner-les-dechets-generes-par-semaine-emballages_et_papier':
      'déchets . ordinaires . emballages et papier . fréquence ramassage',
    '14-veuillez-renseigner-les-dechets-generes-par-semaine-biodéchets':
      'déchets . ordinaires . biodéchets . fréquence ramassage',
    '14-veuillez-renseigner-les-dechets-generes-par-semaine-verre':
      'déchets . ordinaires . verre . fréquence ramassage',
    '12-pour-chacun-de-ces-equipements-electromenagers-veuillez-renseigner-réfrigérateurs':
      'confiseries et boissons . électroménager . réfrigérateurs . nombre',
    '12-pour-chacun-de-ces-equipements-electromenagers-veuillez-renseigner-congélateurs':
      'confiseries et boissons . électroménager . congélateurs . nombre',
    '12-pour-chacun-de-ces-equipements-electromenagers-veuillez-renseigner-warmers':
      'confiseries et boissons . électroménager . warmers . nombre',
    '12-pour-chacun-de-ces-equipements-electromenagers-veuillez-renseigner-distributeurs':
      'confiseries et boissons . électroménager . distributeurs . nombre',
    '12-quelle-quantite-de-materiel-distributeurs-recevez-vous-en-moyenne-par-semaine-affiches_120x160':
      'billetterie et communication . matériel distributeurs . affiches . affiches 120x160 . nombre',
    '12-quelle-quantite-de-materiel-distributeurs-recevez-vous-en-moyenne-par-semaine-affiches_40x60':
      'billetterie et communication . matériel distributeurs . affiches . affiches 40x60 . nombre',
    '12-quelles-sont-les-distances-parcourues-au-total-sur-lannee-pour-chacun-des-modes-de-transport-suivants-RER_et_transilien':
      'mobilité spectateurs . résultat précis . empreinte . RER et transilien . distance',
    '12-quelles-sont-les-distances-parcourues-au-total-sur-lannee-pour-chacun-des-modes-de-transport-suivants-métro_ou_tram':
      'mobilité spectateurs . résultat précis . empreinte . métro ou tram . distance',
    '12-quelles-sont-les-distances-parcourues-au-total-sur-lannee-pour-chacun-des-modes-de-transport-suivants-bus':
      'mobilité spectateurs . résultat précis . empreinte . bus . distance',
    '12-quelles-sont-les-distances-parcourues-au-total-sur-lannee-pour-chacun-des-modes-de-transport-suivants-vélo_électrique':
      'mobilité spectateurs . résultat précis . empreinte . vélo électrique . distance',
    '12-quelles-sont-les-distances-parcourues-au-total-sur-lannee-pour-chacun-des-modes-de-transport-suivants-vélo_classique':
      'mobilité spectateurs . résultat précis . empreinte . vélo classique . distance',
    '12-quelles-sont-les-distances-parcourues-au-total-sur-lannee-pour-chacun-des-modes-de-transport-suivants-marche':
      'mobilité spectateurs . résultat précis . empreinte . marche . distance',
    '12-quelles-sont-les-distances-parcourues-au-total-sur-lannee-pour-chacun-des-modes-de-transport-suivants-voiture_diesel':
      'mobilité spectateurs . résultat précis . empreinte . voiture diesel . distance',
    '12-quelles-sont-les-distances-parcourues-au-total-sur-lannee-pour-chacun-des-modes-de-transport-suivants-voiture_essence':
      'mobilité spectateurs . résultat précis . empreinte . voiture essence . distance',
    '12-quelles-sont-les-distances-parcourues-au-total-sur-lannee-pour-chacun-des-modes-de-transport-suivants-voiture_hybride':
      'mobilité spectateurs . résultat précis . empreinte . voiture hybride . distance',
    '12-quelles-sont-les-distances-parcourues-au-total-sur-lannee-pour-chacun-des-modes-de-transport-suivants-voiture_électrique':
      'mobilité spectateurs . résultat précis . empreinte . voiture électrique . distance',
    '12-quelles-sont-les-distances-parcourues-au-total-sur-lannee-pour-chacun-des-modes-de-transport-suivants-moto':
      'mobilité spectateurs . résultat précis . empreinte . moto . distance',
    '12-quelles-sont-les-distances-parcourues-au-total-sur-lannee-pour-chacun-des-modes-de-transport-suivants-scooter':
      'mobilité spectateurs . résultat précis . empreinte . scooter . distance',
    '12-quelles-sont-les-distances-parcourues-au-total-sur-lannee-pour-chacun-des-modes-de-transport-suivants-trottinette_électrique':
      'mobilité spectateurs . résultat précis . empreinte . trottinette électrique . distance',
    '12-quelle-quantite-de-materiel-produisez-vous-chaque-mois-affiches':
      'billetterie et communication . matériel cinéma . production . affiches . nombre',
    '12-quelle-quantite-de-materiel-produisez-vous-chaque-mois-programme':
      'billetterie et communication . matériel cinéma . production . programme . nombre',
    '12-quelle-quantite-de-materiel-produisez-vous-chaque-mois-flyers':
      'billetterie et communication . matériel cinéma . production . flyers . nombre',
    '12-quelle-quantite-de-materiel-distributeurs-recevez-vous-en-moyenne-par-mois-PLV_comptoir':
      'billetterie et communication . matériel distributeurs . PLV . PLV comptoir . nombre',
    '12-quelle-quantite-de-materiel-distributeurs-recevez-vous-en-moyenne-par-mois-PLV_grand_format':
      'billetterie et communication . matériel distributeurs . PLV . PLV grand format . nombre',
    '14-pour-chacun-de-ces-equipements-informatiques-veuillez-indiquer':
      'fonctionnement . activités de bureau . informatique . appareil . durée location',
    '13-pour-chacun-de-ces-equipements-informatiques-veuillez-indiquer':
      'fonctionnement . activités de bureau . informatique . appareil . nombre',
    '108-decrivez-les-differentes-salles-du-cinema':
      'salles et cabines . matériel technique . salle . fauteuils . nombre',
  },
  TEXT: {
    'quand-le-batiment-a-t-il-ete-construit': 'fonctionnement . bâtiment . construction . année de construction',
    '101-decrivez-les-differentes-salles-du-cinema': 'salles et cabines . matériel technique . salle . nom',
    '12-pour-chacun-de-ces-equipements-informatiques-veuillez-indiquer':
      'fonctionnement . activités de bureau . informatique . appareil . année achat',
    '111-decrivez-les-differentes-salles-du-cinema':
      'salles et cabines . matériel technique . salle . système son . année achat',
    '11-decrivez-les-deplacements-professionnels-de-vos-collaborateurs':
      'fonctionnement . déplacements pro . déplacement type . nom',
    '13-pour-chacun-de-ces-equipements-electromenagers-veuillez-renseigner-réfrigérateurs':
      'confiseries et boissons . électroménager . réfrigérateurs . année achat',
    '14-pour-chacun-de-ces-equipements-electromenagers-veuillez-renseigner-réfrigérateurs':
      'confiseries et boissons . électroménager . réfrigérateurs . durée location',
    '13-pour-chacun-de-ces-equipements-electromenagers-veuillez-renseigner-congélateurs':
      'confiseries et boissons . électroménager . congélateurs . année achat',
    '14-pour-chacun-de-ces-equipements-electromenagers-veuillez-renseigner-congélateurs':
      'confiseries et boissons . électroménager . congélateurs . durée location',
    '13-pour-chacun-de-ces-equipements-electromenagers-veuillez-renseigner-warmers':
      'confiseries et boissons . électroménager . warmers . année achat',
    '14-pour-chacun-de-ces-equipements-electromenagers-veuillez-renseigner-warmers':
      'confiseries et boissons . électroménager . warmers . durée location',
    '13-pour-chacun-de-ces-equipements-electromenagers-veuillez-renseigner-distributeurs':
      'confiseries et boissons . électroménager . distributeurs . année achat',
    '14-pour-chacun-de-ces-equipements-electromenagers-veuillez-renseigner-distributeurs':
      'confiseries et boissons . électroménager . distributeurs . durée location',
    '11-quel-est-le-rythme-de-travail-des-collaborateurs-du-cinema':
      'fonctionnement . équipe . collaborateur type . nom',
    '109-decrivez-les-differentes-salles-du-cinema':
      'salles et cabines . matériel technique . salle . fauteuils . année achat',
    '103-decrivez-les-differentes-salles-du-cinema':
      'salles et cabines . matériel technique . salle . projecteur . année achat',
    '106-decrivez-les-differentes-salles-du-cinema':
      'salles et cabines . matériel technique . salle . écran . année achat',
    // Visiblement, cette question n'existe plus
    // '10-comment-stockez-vous-les-films': ''
  },
  QCU: {
    'le-cinema-dispose-t-il-dun-parking': 'fonctionnement . bâtiment . parking présent',
    'vendez-vous-des-boissons-et-des-confiseries': 'confiseries et boissons . achats . vente sur place',
    'le-batiment-est-il-partage-avec-une-autre-activite': 'fonctionnement . bâtiment . est partagé',
    'votre-cinema-est-il-equipe-de-la-climatisation': 'fonctionnement . énergie . est équipé climatisation',
    // Visiblement, cette question n'existe plus
    // '12-comment-stockez-vous-les-films': ''
    // '11-comment-stockez-vous-les-films': ''
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
    '107-decrivez-les-differentes-salles-du-cinema': [
      'salles et cabines . matériel technique . salle . fauteuils . type',
      {
        'Fauteuils classiques': 'fauteuils classiques',
        'Fauteuils 4DX': 'fauteuils 4DX',
      },
    ],
    '14-quel-est-le-rythme-de-travail-des-collaborateurs-du-cinema': [
      'fonctionnement . équipe . collaborateur type . transport . moyen de transport',
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
        // THX: '',
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
    '11-veuillez-renseigner-les-dechets-generes-par-semaine': [
      'déchets . ordinaires',
      {
        'Ordures ménagères (déchets non triés / sans filière)': 'ordures ménagères',
        'Emballages et papier (plastique, métal, papier et carton)': 'emballages et papier',
        'Biodéchets (restes alimentaires)': 'biodéchets',
        'Déchets verre': 'verre',
      },
    ],
    '11-pour-chacun-de-ces-equipements-electromenagers-veuillez-renseigner': [
      'confiseries et boissons . électroménager . appareil',
      {
        Réfrigérateurs: 'réfrigérateurs',
        Congélateurs: 'congélateurs',
        Warmers: 'warmers',
        'Distributeurs snacks / boisson': 'distributeurs',
      },
    ],
    '11-quelle-quantite-de-materiel-distributeurs-recevez-vous-en-moyenne-par-semaine': [
      'billetterie et communication . matériel distributeurs . affiches',
      {
        'Affiches 120x160': 'affiches 120x160',
        'Affiches 40x60': 'affiches 40x60',
      },
    ],
    '11-quelles-sont-les-distances-parcourues-au-total-sur-lannee-pour-chacun-des-modes-de-transport-suivants': [
      'mobilité spectateurs . résultat précis . empreinte',
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
    '11-quelle-quantite-de-materiel-produisez-vous-chaque-mois': [
      'billetterie et communication . matériel cinéma . production',
      {
        Affiches: 'affiches',
        Programme: 'programme',
        Flyers: 'flyers',
      },
    ],
    '11-quelle-quantite-de-materiel-distributeurs-recevez-vous-en-moyenne-par-mois': [
      'billetterie et communication . matériel distributeurs . PLV',
      {
        'PLV comptoir': 'PLV comptoir',
        'PLV grand format': 'PLV grand format',
      },
    ],
  },
  TABLE: {
    '10-veuillez-renseigner-les-dechets-generes-par-semaine': 'TABLEAU',
    '10-pour-chacun-de-ces-equipements-electromenagers-veuillez-renseigner': 'TABLEAU',
    '10-quelle-quantite-de-materiel-distributeurs-recevez-vous-en-moyenne-par-semaine': 'TABLEAU',
    '10-quelles-sont-les-distances-parcourues-au-total-sur-lannee-pour-chacun-des-modes-de-transport-suivants':
      'TABLEAU',
    '10-quelle-quantite-de-materiel-produisez-vous-chaque-mois': 'TABLEAU',
    '10-quelle-quantite-de-materiel-distributeurs-recevez-vous-en-moyenne-par-mois': 'TABLEAU',
    '10-pour-chacun-de-ces-equipements-informatiques-veuillez-indiquer': [
      'LISTE',
      'fonctionnement . activités de bureau . informatique . appareil',
    ],
    '10-decrivez-les-deplacements-professionnels-de-vos-collaborateurs': [
      'LISTE',
      'fonctionnement . déplacements pro . déplacement type',
    ],
    '10-quel-est-le-rythme-de-travail-des-collaborateurs-du-cinema': [
      'LISTE',
      'fonctionnement . équipe . collaborateur type',
    ],
    '10-decrivez-les-differentes-salles-du-cinema': ['LISTE', 'salles et cabines . matériel technique . salle'],

    // Visiblement, ces questions n'existent plus
    // '10-comment-stockez-vous-les-films',
  },
}
