import { FormLayout, inputLayout, tableLayout } from '@/components/publicodes-form/layouts/formLayout'
import { ClicksonPost } from '@/services/posts.enums'
import { SubPost } from '@prisma/client'
import { ClicksonRuleName } from './types'

export const getPostRuleNameClickson = (post: ClicksonPost): ClicksonRuleName => {
  return POST_TO_RULENAME[post]
}

export const getSubPostRuleNameClickson = (subPost: SubPost): ClicksonRuleName | undefined => {
  return SUBPOST_TO_RULENAME[subPost]
}

export const hasPublicodesMapping = (subPost: SubPost): boolean => {
  return SUBPOST_TO_RULENAME[subPost] !== undefined
}

export const getFormLayoutsForSubPostClickson = (subPost: SubPost): FormLayout<ClicksonRuleName>[] => {
  return SUBPOST_TO_FORM_LAYOUTS[subPost] || []
}

const POST_TO_RULENAME: Record<ClicksonPost, ClicksonRuleName> = {
  EnergiesClickson: 'énergie',
  Restauration: 'restauration',
  DeplacementsClickson: 'déplacements',
  Achats: 'achats',
  ImmobilisationsClickson: 'immobilisations',
} as const

const SUBPOST_TO_RULENAME: Partial<Record<SubPost, ClicksonRuleName>> = {
  Electricite: 'énergie . électricité',
  Combustibles: 'énergie . combustibles',
  AutresGaz: 'énergie . autres gaz',
  TypesDeRepasServis: 'restauration . types de repas servis',
  DistributeursAutomatiques: 'restauration . distributeur automatiques',
  Fret: 'restauration . fret',
  DechetsOrganiques: 'restauration . déchets organiques',
  TransportDesEleves: 'déplacements . transport des élèves',
  TransportDuPersonnel: 'déplacements . transport du personnel',
  VoyagesScolaires: 'déplacements . voyages scolaires',
  Fournitures: 'achats . fournitures',
  ProduitsChimiques: 'achats . produits chimiques',
  EquipementsDeSport: 'achats . équipements de sport',
  DechetsRecyclables: 'achats . déchets recyclables',
  OrduresMenageresResiduelles: 'achats . ordures ménagères résiduelles',
  Construction: 'immobilisations . construction',
  Renovation: 'immobilisations . rénovation',
  EquipementsInformatiqueAudiovisuel: 'immobilisations . équipements informatique audiovisuel',
  EquipementsDivers: 'immobilisations . équipements divers',
} as const

const input = (rule: ClicksonRuleName): FormLayout<ClicksonRuleName> => inputLayout<ClicksonRuleName>(rule)
const table = (title: string, headers: string[], rows: ClicksonRuleName[][]): FormLayout<ClicksonRuleName> =>
  tableLayout<ClicksonRuleName>(title, headers, rows)

export const SUBPOST_TO_FORM_LAYOUTS: Partial<Record<SubPost, FormLayout<ClicksonRuleName>[]>> = {
  Electricite: [input('énergie . électricité . consommation')],
  Combustibles: [
    input('énergie . combustibles . fioul domestique . consommation'),
    input('énergie . combustibles . fioul lourd . consommation'),
    input('énergie . combustibles . gaz naturel . consommation'),
    input('énergie . combustibles . granulés de bois . consommation'),
    input('énergie . combustibles . biopropane . consommation'),
    input('énergie . combustibles . réseau de chaleur . consommation'),
  ],
  AutresGaz: [
    input('énergie . autres gaz . gaz hfc spécifique . consommation'),
    input('énergie . autres gaz . gaz hfc spécifique . PRG'),
  ],
  TypesDeRepasServis: [
    input('restauration . types de repas servis . moyen . nombre'),
    input('restauration . types de repas servis . végétarien . nombre'),
    input('restauration . types de repas servis . végétalien . nombre'),
    input('restauration . types de repas servis . viande blanche . nombre'),
    input('restauration . types de repas servis . poisson . nombre'),
    input('restauration . types de repas servis . viande rouge . nombre'),
  ],
  DistributeursAutomatiques: [
    input("restauration . distributeur automatiques . bouteille d'eau . nombre"),
    input('restauration . distributeur automatiques . soda . nombre'),
    input('restauration . distributeur automatiques . biscuits . nombre'),
    input('restauration . distributeur automatiques . paquet de chips . nombre'),
    input('restauration . distributeur automatiques . café noir . nombre'),
    input('restauration . distributeur automatiques . thé infusé . nombre'),
    input('restauration . distributeur automatiques . sandwich pain de mie . nombre'),
    input('restauration . distributeur automatiques . barre chocolatée . nombre'),
  ],
  Fret: [
    input('restauration . fret . routier . consommation'),
    input('restauration . fret . ferroviaire . consommation'),
    input('restauration . fret . maritime . consommation'),
  ],
  DechetsOrganiques: [
    input('restauration . déchets organiques . biodéchets compostés . quantité'),
    input('restauration . déchets organiques . biodéchets méthanisés . quantité'),
    input('restauration . déchets organiques . biodéchets incinérés . quantité'),
    input('restauration . déchets organiques . biodéchets enfouis . quantité'),
  ],
  TransportDesEleves: [
    table(
      'TransportDesEleves.question',
      ['TransportDesEleves.moyenTransport', 'TransportDesEleves.distance'],
      [
        [
          'déplacements . transport des élèves . avion court courrier',
          'déplacements . transport des élèves . avion court courrier . distance',
        ],
        [
          'déplacements . transport des élèves . avion moyen courrier',
          'déplacements . transport des élèves . avion moyen courrier . distance',
        ],
        [
          'déplacements . transport des élèves . avion long courrier',
          'déplacements . transport des élèves . avion long courrier . distance',
        ],
        ['déplacements . transport des élèves . bus', 'déplacements . transport des élèves . bus . distance'],
        [
          'déplacements . transport des élèves . métro ou tram',
          'déplacements . transport des élèves . métro ou tram . distance',
        ],
        [
          'déplacements . transport des élèves . moto essence',
          'déplacements . transport des élèves . moto essence . distance',
        ],
        [
          'déplacements . transport des élèves . RER et transilien',
          'déplacements . transport des élèves . RER et transilien . distance',
        ],
        ['déplacements . transport des élèves . TER', 'déplacements . transport des élèves . TER . distance'],
        ['déplacements . transport des élèves . TGV', 'déplacements . transport des élèves . TGV . distance'],
        [
          'déplacements . transport des élèves . trottinette électrique',
          'déplacements . transport des élèves . trottinette électrique . distance',
        ],
        [
          'déplacements . transport des élèves . véhicule compact électrique',
          'déplacements . transport des élèves . véhicule compact électrique . distance',
        ],
        [
          'déplacements . transport des élèves . vélo électrique',
          'déplacements . transport des élèves . vélo électrique . distance',
        ],
        [
          'déplacements . transport des élèves . voiture individuelle diesel',
          'déplacements . transport des élèves . voiture individuelle diesel . distance',
        ],
        [
          'déplacements . transport des élèves . voiture individuelle essence',
          'déplacements . transport des élèves . voiture individuelle essence . distance',
        ],
      ],
    ),
  ],
  TransportDuPersonnel: [
    table(
      'TransportDuPersonnel.question',
      ['TransportDuPersonnel.moyenTransport', 'TransportDuPersonnel.distance'],
      [
        [
          'déplacements . transport du personnel . avion court courrier',
          'déplacements . transport du personnel . avion court courrier . distance',
        ],
        [
          'déplacements . transport du personnel . avion moyen courrier',
          'déplacements . transport du personnel . avion moyen courrier . distance',
        ],
        [
          'déplacements . transport du personnel . avion long courrier',
          'déplacements . transport du personnel . avion long courrier . distance',
        ],
        ['déplacements . transport du personnel . bus', 'déplacements . transport du personnel . bus . distance'],
        [
          'déplacements . transport du personnel . métro ou tram',
          'déplacements . transport du personnel . métro ou tram . distance',
        ],
        [
          'déplacements . transport du personnel . moto essence',
          'déplacements . transport du personnel . moto essence . distance',
        ],
        [
          'déplacements . transport du personnel . RER et transilien',
          'déplacements . transport du personnel . RER et transilien . distance',
        ],
        ['déplacements . transport du personnel . TER', 'déplacements . transport du personnel . TER . distance'],
        ['déplacements . transport du personnel . TGV', 'déplacements . transport du personnel . TGV . distance'],
        [
          'déplacements . transport du personnel . trottinette électrique',
          'déplacements . transport du personnel . trottinette électrique . distance',
        ],
        [
          'déplacements . transport du personnel . véhicule compact électrique',
          'déplacements . transport du personnel . véhicule compact électrique . distance',
        ],
        [
          'déplacements . transport du personnel . vélo électrique',
          'déplacements . transport du personnel . vélo électrique . distance',
        ],
        [
          'déplacements . transport du personnel . voiture individuelle diesel',
          'déplacements . transport du personnel . voiture individuelle diesel . distance',
        ],
        [
          'déplacements . transport du personnel . voiture individuelle essence',
          'déplacements . transport du personnel . voiture individuelle essence . distance',
        ],
      ],
    ),
  ],
  VoyagesScolaires: [
    table(
      'VoyagesScolaires.question',
      ['VoyagesScolaires.moyenTransport', 'VoyagesScolaires.distance'],
      [
        [
          'déplacements . voyages scolaires . avion court courrier',
          'déplacements . voyages scolaires . avion court courrier . distance',
        ],
        [
          'déplacements . voyages scolaires . avion moyen courrier',
          'déplacements . voyages scolaires . avion moyen courrier . distance',
        ],
        [
          'déplacements . voyages scolaires . avion long courrier',
          'déplacements . voyages scolaires . avion long courrier . distance',
        ],
        ['déplacements . voyages scolaires . bus', 'déplacements . voyages scolaires . bus . distance'],
        [
          'déplacements . voyages scolaires . métro ou tram',
          'déplacements . voyages scolaires . métro ou tram . distance',
        ],
        [
          'déplacements . voyages scolaires . moto essence',
          'déplacements . voyages scolaires . moto essence . distance',
        ],
        [
          'déplacements . voyages scolaires . RER et transilien',
          'déplacements . voyages scolaires . RER et transilien . distance',
        ],
        ['déplacements . voyages scolaires . TER', 'déplacements . voyages scolaires . TER . distance'],
        ['déplacements . voyages scolaires . TGV', 'déplacements . voyages scolaires . TGV . distance'],
        [
          'déplacements . voyages scolaires . trottinette électrique',
          'déplacements . voyages scolaires . trottinette électrique . distance',
        ],
        [
          'déplacements . voyages scolaires . véhicule compact électrique',
          'déplacements . voyages scolaires . véhicule compact électrique . distance',
        ],
        [
          'déplacements . voyages scolaires . vélo électrique',
          'déplacements . voyages scolaires . vélo électrique . distance',
        ],
        [
          'déplacements . voyages scolaires . voiture individuelle diesel',
          'déplacements . voyages scolaires . voiture individuelle diesel . distance',
        ],
        [
          'déplacements . voyages scolaires . voiture individuelle essence',
          'déplacements . voyages scolaires . voiture individuelle essence . distance',
        ],
      ],
    ),
  ],
  Fournitures: [
    input('achats . fournitures . petites fournitures . montant'),
    input('achats . fournitures . livres . nombre'),
    input('achats . fournitures . papier ramette . nombre'),
    input('achats . fournitures . consommables . montant'),
    input('achats . fournitures . piles aaa . nombre'),
    input('achats . fournitures . piles aa . nombre'),
  ],
  ProduitsChimiques: [
    input('achats . produits chimiques . produit vaisselle liquide . consommation'),
    input('achats . produits chimiques . savon liquide . consommation'),
    input('achats . produits chimiques . produit vitre . consommation'),
    input('achats . produits chimiques . nettoyant sols . consommation'),
    input('achats . produits chimiques . nettoyant multi-usages . consommation'),
    input('achats . produits chimiques . détergent sanitaire . consommation'),
    input('achats . produits chimiques . désinfectant . consommation'),
    input('achats . produits chimiques . chlore . consommation'),
    input('achats . produits chimiques . bicarbonate de soude . consommation'),
    input('achats . produits chimiques . savon solide . consommation'),
    input('achats . produits chimiques . vinaigre blanc . consommation'),
    input('achats . produits chimiques . soude solide . consommation'),
    input('achats . produits chimiques . acide sulfurique . consommation'),
    input('achats . produits chimiques . acide chlorhydrique . consommation'),
    input('achats . produits chimiques . peinture revêtement mural intérieur . consommation'),
    input('achats . produits chimiques . peinture revêtement mural extérieur . consommation'),
  ],
  EquipementsDeSport: [
    input('achats . équipements de sport . ballon de volley . nombre'),
    input('achats . équipements de sport . ballon de handball . nombre'),
    input('achats . équipements de sport . kimono judo . nombre'),
    input('achats . équipements de sport . shorts tous sports . nombre'),
    input('achats . équipements de sport . maillots tous sports . nombre'),
    input('achats . équipements de sport . t-shirt polyester . nombre'),
    input('achats . équipements de sport . ballon de rugby . nombre'),
    input('achats . équipements de sport . ballon de basket . nombre'),
    input('achats . équipements de sport . ballon de football . nombre'),
  ],
  DechetsRecyclables: [
    input('achats . déchets recyclables . papier . nombre'),
    input('achats . déchets recyclables . carton . nombre'),
    input('achats . déchets recyclables . plastique . nombre'),
    input('achats . déchets recyclables . verre . nombre'),
    input('achats . déchets recyclables . métal . nombre'),
    input('achats . déchets recyclables . bois . nombre'),
    input('achats . déchets recyclables . textiles . nombre'),
    input('achats . déchets recyclables . DEEE . nombre'),
  ],
  OrduresMenageresResiduelles: [
    input('achats . ordures ménagères résiduelles . ordures ménagères résiduelles . nombre'),
  ],
  Construction: [
    input('immobilisations . construction . bâtiment scolaire structure béton . surface'),
    input('immobilisations . construction . parking bâtiment structure béton . surface'),
    input('immobilisations . construction . parking surface bitume . surface'),
    input('immobilisations . construction . parking surface semi-dure . surface'),
    input('immobilisations . construction . garage structure béton . surface'),
    input('immobilisations . construction . garage structure métal . surface'),
  ],
  Renovation: [
    input('immobilisations . rénovation . bâtiment scolaire structure béton rénové . surface'),
    input('immobilisations . rénovation . parking bâtiment structure béton rénové . surface'),
    input('immobilisations . rénovation . parking surface bitume rénové . surface'),
    input('immobilisations . rénovation . parking surface semi-dure rénové . surface'),
    input('immobilisations . rénovation . garage structure béton rénové . surface'),
    input('immobilisations . rénovation . garage structure métal rénové . surface'),
  ],
  EquipementsInformatiqueAudiovisuel: [
    table(
      'EquipementsInformatiqueAudiovisuel.question',
      ['EquipementsInformatiqueAudiovisuel.equipement', 'EquipementsInformatiqueAudiovisuel.nombre'],
      [
        [
          'immobilisations . équipements informatique audiovisuel . ordinateur de bureau',
          'immobilisations . équipements informatique audiovisuel . ordinateur de bureau . nombre',
        ],
        [
          'immobilisations . équipements informatique audiovisuel . ordinateur portable',
          'immobilisations . équipements informatique audiovisuel . ordinateur portable . nombre',
        ],
        [
          'immobilisations . équipements informatique audiovisuel . tablette',
          'immobilisations . équipements informatique audiovisuel . tablette . nombre',
        ],
        [
          'immobilisations . équipements informatique audiovisuel . imprimante',
          'immobilisations . équipements informatique audiovisuel . imprimante . nombre',
        ],
        [
          'immobilisations . équipements informatique audiovisuel . photocopieur',
          'immobilisations . équipements informatique audiovisuel . photocopieur . nombre',
        ],
        [
          'immobilisations . équipements informatique audiovisuel . vidéoprojecteur',
          'immobilisations . équipements informatique audiovisuel . vidéoprojecteur . nombre',
        ],
        [
          'immobilisations . équipements informatique audiovisuel . serveur informatique',
          'immobilisations . équipements informatique audiovisuel . serveur informatique . nombre',
        ],
        [
          'immobilisations . équipements informatique audiovisuel . télévision 40-49 pouces',
          'immobilisations . équipements informatique audiovisuel . télévision 40-49 pouces . nombre',
        ],
        [
          'immobilisations . équipements informatique audiovisuel . rack de serveur',
          'immobilisations . équipements informatique audiovisuel . rack de serveur . nombre',
        ],
        [
          'immobilisations . équipements informatique audiovisuel . télécommande universelle sans piles 80g',
          'immobilisations . équipements informatique audiovisuel . télécommande universelle sans piles 80g . nombre',
        ],
        [
          'immobilisations . équipements informatique audiovisuel . stéréo classique',
          'immobilisations . équipements informatique audiovisuel . stéréo classique . nombre',
        ],
        [
          'immobilisations . équipements informatique audiovisuel . enceinte Bluetooth',
          'immobilisations . équipements informatique audiovisuel . enceinte Bluetooth . nombre',
        ],
        [
          'immobilisations . équipements informatique audiovisuel . smartphone 5 pouces',
          'immobilisations . équipements informatique audiovisuel . smartphone 5 pouces . nombre',
        ],
        [
          'immobilisations . équipements informatique audiovisuel . écran 23,8 pouces',
          'immobilisations . équipements informatique audiovisuel . écran 23,8 pouces . nombre',
        ],
      ],
    ),
  ],
  EquipementsDivers: [
    input('immobilisations . équipements divers . chaise de bureau . nombre'),
    input('immobilisations . équipements divers . table de réunion . nombre'),
    input('immobilisations . équipements divers . armoire de rangement . nombre'),
    input("immobilisations . équipements divers . fauteuil d'accueil . nombre"),
    input('immobilisations . équipements divers . étagère . nombre'),
    table(
      'EquipementsDivers.question',
      ['EquipementsDivers.equipement', 'EquipementsDivers.nombre'],
      [
        [
          'immobilisations . divers . tondeuse gazon thermique',
          'immobilisations . divers . tondeuse gazon thermique . nombre',
        ],
        [
          'immobilisations . divers . tondeuse gazon électrique',
          'immobilisations . divers . tondeuse gazon électrique . nombre',
        ],
        ['immobilisations . divers . bouilloire', 'immobilisations . divers . bouilloire'],
        ['immobilisations . divers . micro-onde', 'immobilisations . divers . micro-onde . nombre'],
        [
          'immobilisations . divers . aspirateur professionnel',
          'immobilisations . divers . aspirateur professionnel . nombre',
        ],
        [
          'immobilisations . divers . ballon chauffe-eau électrique',
          'immobilisations . divers . ballon chauffe-eau électrique . nombre',
        ],
        ['immobilisations . divers . machine café filtre', 'immobilisations . divers . machine café filtre . nombre'],
        [
          'immobilisations . divers . machine café dosettes',
          'immobilisations . divers . machine café dosettes . nombre',
        ],
        [
          'immobilisations . divers . lave-vaiselle professionnel',
          'immobilisations . divers . lave-vaiselle professionnel . nombre',
        ],
        ['immobilisations . divers . four professionnel', 'immobilisations . divers . four professionnel . nombre'],
        [
          'immobilisations . divers . lave-vaiselle standard',
          'immobilisations . divers . lave-vaiselle standard . nombre',
        ],
        ['immobilisations . divers . lave-linge', 'immobilisations . divers . lave-linge . nombre'],
        ['immobilisations . divers . congélateur coffre', 'immobilisations . divers . congélateur coffre . nombre'],
        ['immobilisations . divers . congélateur armoire', 'immobilisations . divers . congélateur armoire . nombre'],
        ['immobilisations . divers . réfrigérateur', 'immobilisations . divers . réfrigérateur . nombre'],
        [
          'immobilisations . divers . plaques de cuisson au gaz',
          'immobilisations . divers . plaques de cuisson au gaz . nombre',
        ],
        ['immobilisations . divers . tatami', 'immobilisations . divers . tatami . nombre'],
        [
          'immobilisations . divers . gymnastique agré barre fixe',
          'immobilisations . divers . gymnastique agré barre fixe . nombre',
        ],
        [
          'immobilisations . divers . gymnastique agré barres parallèles',
          'immobilisations . divers . gymnastique agré barres parallèles . nombre',
        ],
      ],
    ),
  ],
} as const
