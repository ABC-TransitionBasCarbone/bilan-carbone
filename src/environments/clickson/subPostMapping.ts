import { FormLayout, inputLayout, tableLayout } from '@/components/publicodes-form/layouts/formLayout'
import { ClicksonPost } from '@/services/posts'
import { SubPost } from '@prisma/client'
import { ClicksonRuleName } from './types'

export const getPostRuleName = (post: ClicksonPost): ClicksonRuleName => {
  return POST_TO_RULENAME[post]
}

export const getSubPostRuleName = (subPost: SubPost): ClicksonRuleName | undefined => {
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
    input('restauration . types de repas servis . viande rouge . nombre'),
    input('restauration . types de repas servis . viande blanche . nombre'),
    input('restauration . types de repas servis . poisson . nombre'),
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
    input('déplacements . transport des élèves . distance'),
    input('déplacements . transport des élèves . moyen de transport'),
  ],
  TransportDuPersonnel: [
    input('déplacements . transport du personnel . distance'),
    input('déplacements . transport du personnel . moyen de transport'),
  ],
  VoyagesScolaires: [
    input('déplacements . voyages scolaires . distance'),
    input('déplacements . voyages scolaires . moyen de transport'),
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
      'Équipements informatiques et audiovisuels',
      ['Équipement', 'Nombre'],
      [
        ['immobilisations . équipements informatique audiovisuel . ordinateur de bureau . nombre'],
        ['immobilisations . équipements informatique audiovisuel . ordinateur portable . nombre'],
        ['immobilisations . équipements informatique audiovisuel . tablette . nombre'],
        ['immobilisations . équipements informatique audiovisuel . imprimante . nombre'],
        ['immobilisations . équipements informatique audiovisuel . photocopieur . nombre'],
        ['immobilisations . équipements informatique audiovisuel . vidéoprojecteur . nombre'],
        ['immobilisations . équipements informatique audiovisuel . serveur informatique . nombre'],
        ['immobilisations . équipements informatique audiovisuel . télévision 40-49 pouces . nombre'],
        ['immobilisations . équipements informatique audiovisuel . rack de serveur . nombre'],
        ['immobilisations . équipements informatique audiovisuel . télécommande universelle sans piles 80g . nombre'],
        ['immobilisations . équipements informatique audiovisuel . stéréo classique . nombre'],
        ['immobilisations . équipements informatique audiovisuel . enceinte Bluetooth . nombre'],
        ['immobilisations . équipements informatique audiovisuel . smartphone 5 pouces . nombre'],
        ['immobilisations . équipements informatique audiovisuel . écran 23,8 pouces . nombre'],
      ],
    ),
  ],
  EquipementsDivers: [
    input('immobilisations . équipements divers . chaise de bureau . nombre'),
    input('immobilisations . équipements divers . table de réunion . nombre'),
    input('immobilisations . équipements divers . armoire de rangement . nombre'),
    input("immobilisations . équipements divers . fauteuil d'accueil . nombre"),
    input('immobilisations . équipements divers . étagère . nombre'),
  ],
} as const
