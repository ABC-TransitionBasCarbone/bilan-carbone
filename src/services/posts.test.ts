import { expect } from '@jest/globals'
import { SubPost } from '@prisma/client'
import { convertTiltSubPostToBCSubPost, subPostBCToSubPostTiltMapping } from './posts'

describe('Posts Service', () => {
  describe('convertTiltSubPostToBCSubPost', () => {
    it('should convert a Tilt sub-post to a BC sub-post', () => {
      expect(convertTiltSubPostToBCSubPost(SubPost.TeletravailSalaries)).toBe(SubPost.Electricite)
    })

    it('should fallback to the same sub-post if no mapping exists - should be bc subpost', () => {
      expect(convertTiltSubPostToBCSubPost(SubPost.Batiments)).toBe(SubPost.Batiments)
    })
  })

  describe('getSubPostBCToSubPostTiltMapping', () => {
    it('should return a mapping of BC sub-posts to Tilt sub-posts', () => {
      expect(subPostBCToSubPostTiltMapping).toEqual({
        Batiments: ['Batiments'],
        AutresInfrastructures: ['AutresInfrastructures'],
        CombustiblesFossiles: ['CombustiblesFossiles'],
        CombustiblesOrganiques: ['CombustiblesOrganiques'],
        ReseauxDeChaleurEtDeVapeur: ['ReseauxDeChaleurEtDeVapeur'],
        ReseauxDeFroid: ['ReseauxDeFroid'],
        Electricite: ['Electricite', 'TeletravailSalaries', 'TeletravailBenevoles'],
        DechetsDEmballagesEtPlastiques: ['DechetsDEmballagesEtPlastiques'],
        DechetsOrganiques: ['DechetsOrganiques'],
        DechetsOrduresMenageres: ['DechetsOrduresMenageres'],
        DechetsDangereux: ['DechetsDangereux'],
        DechetsBatiments: ['DechetsBatiments'],
        DechetsFuitesOuEmissionsNonEnergetiques: ['DechetsFuitesOuEmissionsNonEnergetiques'],
        EauxUsees: ['EauxUsees'],
        AutresDechets: ['AutresDechets'],
        EmissionsLieesALaProductionDeFroid: ['FroidEtClim'],
        Agriculture: ['ActivitesAgricoles'],
        EmissionsLieesAuChangementDAffectationDesSolsCas: ['EmissionsLieesAuChangementDAffectationDesSolsCas'],
        EmissionsLieesAuxProcedesIndustriels: ['ActivitesIndustrielles'],
        DeplacementsDomicileTravail: ['DeplacementsDomicileTravailSalaries', 'DeplacementsDomicileTravailBenevoles'],
        DeplacementsProfessionnels: [
          'DeplacementsDansLeCadreDUneMissionAssociativeSalaries',
          'DeplacementsDansLeCadreDUneMissionAssociativeBenevoles',
        ],
        DeplacementsVisiteurs: ['DeplacementsDesBeneficiaires'],
        Equipements: [
          'DeplacementsFabricationDesVehicules',
          'TransportFabricationDesVehicules',
          'EquipementsDesSalaries',
          'EquipementsDesBenevoles',
        ],
        FretEntrant: ['Entrant'],
        FretInterne: ['Interne'],
        FretSortant: ['Sortant'],
        MetauxPlastiquesEtVerre: ['MetauxPlastiquesEtVerre'],
        PapiersCartons: ['PapiersCartons'],
        MateriauxDeConstruction: ['MateriauxDeConstruction'],
        ProduitsChimiquesEtHydrogene: ['ProduitsChimiquesEtHydrogene'],
        MatiereDestineeAuxEmballages: ['MatiereDestineeAuxEmballages'],
        AutresIntrants: ['AutresIntrants'],
        BiensEtMatieresEnApprocheMonetaire: ['BiensEtMatieresEnApprocheMonetaire'],
        NourritureRepasBoissons: [
          'RepasPrisParLesSalaries',
          'RepasPrisParLesBenevoles',
          'RepasPrisParLesBeneficiaires',
        ],
        AchatsDeServices: ['AchatsDeServices'],
        UsagesNumeriques: ['UsagesNumeriques'],
        ServicesEnApprocheMonetaire: ['ServicesEnApprocheMonetaire'],
        Informatique: ['ParcInformatiqueDesSalaries', 'ParcInformatiqueDesBenevoles'],
        UtilisationEnResponsabilite: [
          'UtilisationEnResponsabiliteConsommationDeBiens',
          'UtilisationEnResponsabiliteConsommationNumerique',
          'UtilisationEnResponsabiliteConsommationDEnergie',
          'UtilisationEnResponsabiliteFuitesEtAutresConsommations',
        ],
        UtilisationEnDependance: [
          'UtilisationEnDependanceConsommationDeBiens',
          'UtilisationEnDependanceConsommationNumerique',
          'UtilisationEnDependanceConsommationDEnergie',
          'UtilisationEnDependanceFuitesEtAutresConsommations',
        ],
        InvestissementsFinanciersRealises: ['InvestissementsFinanciersRealises'],
        ConsommationDEnergieEnFinDeVie: ['ConsommationDEnergieEnFinDeVie'],
        TraitementDesDechetsEnFinDeVie: ['TraitementDesDechetsEnFinDeVie'],
        FuitesOuEmissionsNonEnergetiques: ['FuitesOuEmissionsNonEnergetiques'],
        TraitementDesEmballagesEnFinDeVie: ['TraitementDesEmballagesEnFinDeVie'],
      })
    })
  })
})
