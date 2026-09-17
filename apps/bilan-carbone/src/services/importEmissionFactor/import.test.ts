import {
  EmissionFactorBase,
  EmissionFactorStatus,
  Environment,
  Import,
  SubPost,
  Unit,
} from '@abc-transitionbascarbone/db-common/enums'
import { expect } from '@jest/globals'
import {
  getBaseFunc,
  getEmissionFactorOverrideData,
  getEmissionFactorPartOverrideData,
  getSubPosts,
  ImportEmissionFactor,
  isSourceForEnv,
} from './import'

// TODO : remove these mocks. Should not be mocked but tests fail if not
jest.mock('../file', () => ({ download: jest.fn() }))
jest.mock('../auth', () => ({ auth: jest.fn() }))
jest.mock('uuid', () => ({ v4: jest.fn() }))

jest.mock('../permissions/study', () => ({ canReadStudy: jest.fn() }))
jest.mock('../../utils/study', () => ({ getAccountRoleOnStudy: jest.fn() }))
jest.mock('next-intl/server', () => ({
  getTranslations: jest.fn(() => (key: string) => key),
}))

describe('import Service', () => {
  describe('isSourceForEnv', () => {
    it('should retrieve sources for env', async () => {
      process.env.BC_FE_SOURCES_IMPORT = 'BaseEmpreinte,Legifrance,NegaOctet,Manual,ADEME,CUT'
      const result = await isSourceForEnv(Environment.BC)
      expect(result).toEqual([Import.BaseEmpreinte, Import.Legifrance, Import.NegaOctet, Import.Manual, Import.CUT])
    })

    it('should not retrieve sources when env has no import', async () => {
      process.env.BC_FE_SOURCES_IMPORT = ''
      const result = await isSourceForEnv(Environment.BC)
      expect(result).toEqual([])
    })
  })

  describe('getSubPosts', () => {
    const baseEF = {
      "Identifiant_de_l'élément": '123',
      Nom_base_français: 'test',
    }

    it('should return cold network if legifrance and cold', () => {
      const ef = {
        ...baseEF,
        reseau: 'froid' as ImportEmissionFactor['reseau'],
      }

      const result = getSubPosts(ef, Import.Legifrance)

      expect(result).toEqual([SubPost.ReseauxDeFroid])
    })

    it('should return hot network if legifrance and hot', () => {
      const ef = {
        ...baseEF,
        reseau: 'chaud' as ImportEmissionFactor['reseau'],
      }

      const result = getSubPosts(ef, Import.Legifrance)

      expect(result).toEqual([SubPost.ReseauxDeChaleurEtDeVapeur])
    })

    it('should return an error if legifrance and not hot or cold', () => {
      try {
        const ef = {
          ...baseEF,
          reseau: 'azerty' as ImportEmissionFactor['reseau'],
        }

        getSubPosts(ef, Import.Legifrance)

        expect(true).toBe(false)
      } catch (e) {
        // On ne peut pas gérer ce qui vient de e. Ici ca me parait ok d'avoir un any explicite.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((e as any).message).toMatch('reseau is not provided for emission factor')
      }
    })

    it('should return numerique if negaoctet or cut', () => {
      const resultNegaoctet = getSubPosts(baseEF, Import.NegaOctet)
      expect(resultNegaoctet).toEqual([SubPost.UsagesNumeriques])
      const resultCut = getSubPosts(baseEF, Import.CUT)
      expect(resultCut).toEqual([SubPost.UsagesNumeriques])
    })

    it('should return electricity if aib', () => {
      const result = getSubPosts(baseEF, Import.AIB)
      expect(result).toEqual([SubPost.Electricite])
    })

    it('should return empty if bad id and base empreinte or giec', () => {
      expect(getSubPosts(baseEF, Import.BaseEmpreinte)).toEqual([])
      expect(getSubPosts(baseEF, Import.GIEC)).toEqual([])
    })

    it('should return subposts if good id and base empreinte or giec', () => {
      const ef = {
        ...baseEF,
        "Identifiant_de_l'élément": '48818',
      }
      expect(getSubPosts(ef, Import.BaseEmpreinte)).toEqual(
        expect.arrayContaining([
          SubPost.CombustiblesFossiles,
          SubPost.FretEntrant,
          SubPost.FretInterne,
          SubPost.FretSortant,
          SubPost.DeplacementsDomicileTravail,
          SubPost.DeplacementsProfessionnels,
          SubPost.ConsommationDEnergieEnFinDeVie,
          SubPost.UtilisationEnResponsabilite,
          SubPost.UtilisationEnDependance,
        ]),
      )
      expect(getSubPosts(ef, Import.GIEC)).toEqual(
        expect.arrayContaining([
          SubPost.CombustiblesFossiles,
          SubPost.FretEntrant,
          SubPost.FretInterne,
          SubPost.FretSortant,
          SubPost.DeplacementsDomicileTravail,
          SubPost.DeplacementsProfessionnels,
          SubPost.ConsommationDEnergieEnFinDeVie,
          SubPost.UtilisationEnResponsabilite,
          SubPost.UtilisationEnDependance,
        ]),
      )
    })
  })

  describe('getBaseFunc', () => {
    it('should return null for lots of import', () => {
      expect(getBaseFunc(Object.values(SubPost), Import.Legifrance)).toBeNull()
      expect(getBaseFunc(Object.values(SubPost), Import.NegaOctet)).toBeNull()
      expect(getBaseFunc(Object.values(SubPost), Import.CUT)).toBeNull()
    })

    it('should return market if AIB', () => {
      expect(getBaseFunc(Object.values(SubPost), Import.AIB)).toBe(EmissionFactorBase.MarketBased)
    })

    it('should return location if electricity and null otherwise for giec and base empreinte', () => {
      expect(getBaseFunc([SubPost.Electricite], Import.BaseEmpreinte)).toBe(EmissionFactorBase.LocationBased)
      expect(
        getBaseFunc([SubPost.Agriculture, SubPost.Electricite, SubPost.AchatsDeServices], Import.BaseEmpreinte),
      ).toBe(EmissionFactorBase.LocationBased)
      expect(getBaseFunc([SubPost.Agriculture, SubPost.AchatsDeServices], Import.BaseEmpreinte)).toBeNull()

      expect(getBaseFunc([SubPost.Electricite], Import.GIEC)).toBe(EmissionFactorBase.LocationBased)
      expect(getBaseFunc([SubPost.Agriculture, SubPost.Electricite, SubPost.AchatsDeServices], Import.GIEC)).toBe(
        EmissionFactorBase.LocationBased,
      )
      expect(getBaseFunc([SubPost.Agriculture, SubPost.AchatsDeServices], Import.GIEC)).toBeNull()
    })
  })

  describe('getEmissionFactorOverrideData', () => {
    it('should reuse the import mapping for all non-identifier EF fields', () => {
      const row: ImportEmissionFactor = {
        "Identifiant_de_l'élément": '48818',
        "Statut_de_l'élément": 'Archivé',
        Type_Ligne: 'Élément',
        Source: 'Source override',
        Type_poste: '',
        Localisation_géographique: 'France',
        'Sous-localisation_géographique_français': 'Paris',
        'Sous-localisation_géographique_anglais': 'Paris',
        Commentaire_français: 'Commentaire FR',
        Commentaire_anglais: 'Comment EN',
        Nom_poste_français: '',
        Nom_poste_anglais: '',
        Unité_français: 'kg',
        Unité_anglais: 'kg',
        Tags_français: 'tag fr',
        Tags_anglais: 'tag en',
        Nom_attribut_français: 'Attribut FR',
        Nom_attribut_anglais: 'Attribute EN',
        Nom_base_français: 'Nom FR',
        Nom_base_anglais: 'Name EN',
        Nom_frontière_français: 'Frontière FR',
        Nom_frontière_anglais: 'Boundary EN',
        Total_poste_non_décomposé: 42,
        CO2b: 3,
        CH4f: 4,
        CH4b: 5,
        Autres_GES: 6,
        N2O: 7,
        CO2f: 8,
        Incertitude: 50,
        Qualité: 1,
        Qualité_TeR: 0,
        Qualité_GR: 0,
        Qualité_TiR: 0,
        Qualité_C: 0,
        Code_gaz_supplémentaire_1: 'SF6',
        Valeur_gaz_supplémentaire_1: 9,
        Code_gaz_supplémentaire_2: '',
        Valeur_gaz_supplémentaire_2: 0,
      }

      const overrideData = getEmissionFactorOverrideData(row, Import.BaseEmpreinte, 'ef-id')

      expect(overrideData).not.toHaveProperty('importedId')
      expect(overrideData).not.toHaveProperty('importedFrom')
      expect(overrideData.status).toBe(EmissionFactorStatus.Archived)
      expect(overrideData.source).toBe('Source override')
      expect(overrideData.location).toBe('France')
      expect(overrideData.unit).toBe(Unit.KG)
      expect(overrideData.isMonetary).toBe(false)
      expect(overrideData.totalCo2).toBe(34)
      expect(overrideData.co2b).toBe(3)
      expect(overrideData.ch4f).toBe(4)
      expect(overrideData.ch4b).toBe(5)
      expect(overrideData.n2o).toBe(7)
      expect(overrideData.co2f).toBe(8)
      expect(overrideData.sf6).toBe(9)
      expect(overrideData.otherGES).toBe(6)
      expect(overrideData.technicalRepresentativeness).toBe(2)
      expect(overrideData.geographicRepresentativeness).toBe(2)
      expect(overrideData.temporalRepresentativeness).toBe(2)
      expect(overrideData.completeness).toBe(2)
      expect(overrideData.base).toBe(EmissionFactorBase.LocationBased)
      expect(overrideData.subPosts).toContain(SubPost.Electricite)
      expect(overrideData.overrideRawCsv).toContain('Incertitude')
      expect(overrideData.metaData).toEqual({
        updateMany: expect.arrayContaining([
          expect.objectContaining({
            where: { emissionFactorId: 'ef-id', language: 'fr' },
            data: expect.objectContaining({
              title: 'Nom FR',
              attribute: 'Attribut FR',
              frontiere: 'Frontière FR',
              tag: 'tag fr',
              location: 'Paris',
              comment: 'Commentaire FR',
            }),
          }),
          expect.objectContaining({
            where: { emissionFactorId: 'ef-id', language: 'en' },
            data: expect.objectContaining({
              title: 'Name EN',
              attribute: 'Attribute EN',
              frontiere: 'Boundary EN',
              tag: 'tag en',
              location: 'Paris',
              comment: 'Comment EN',
            }),
          }),
        ]),
      })
    })
  })

  describe('getEmissionFactorPartOverrideData', () => {
    it('should reuse the part import mapping for all non-identifier part fields', () => {
      const partRow: ImportEmissionFactor = {
        "Identifiant_de_l'élément": '48818',
        "Statut_de_l'élément": 'Valide générique',
        Type_Ligne: 'Poste',
        Source: 'Source override',
        Type_poste: 'Amont',
        Localisation_géographique: 'France',
        'Sous-localisation_géographique_français': '',
        'Sous-localisation_géographique_anglais': '',
        Commentaire_français: '',
        Commentaire_anglais: '',
        Nom_poste_français: 'Nom poste FR',
        Nom_poste_anglais: 'Part name EN',
        Unité_français: 'kg',
        Unité_anglais: 'kg',
        Tags_français: '',
        Tags_anglais: '',
        Nom_attribut_français: '',
        Nom_attribut_anglais: '',
        Nom_base_français: 'Nom FR',
        Nom_base_anglais: 'Name EN',
        Nom_frontière_français: '',
        Nom_frontière_anglais: '',
        Total_poste_non_décomposé: 20,
        CO2b: 1,
        CH4f: 2,
        CH4b: 3,
        Autres_GES: 4,
        N2O: 5,
        CO2f: 6,
        Incertitude: 0,
        Qualité: 0,
        Qualité_TeR: 0,
        Qualité_GR: 0,
        Qualité_TiR: 0,
        Qualité_C: 0,
        Code_gaz_supplémentaire_1: 'SF6',
        Valeur_gaz_supplémentaire_1: 7,
        Code_gaz_supplémentaire_2: '',
        Valeur_gaz_supplémentaire_2: 0,
      }

      const overrideData = getEmissionFactorPartOverrideData(partRow, 'part-id')

      expect(overrideData).not.toHaveProperty('type')
      expect(overrideData.totalCo2).toBe(24)
      expect(overrideData.co2b).toBe(1)
      expect(overrideData.ch4f).toBe(2)
      expect(overrideData.ch4b).toBe(3)
      expect(overrideData.n2o).toBe(5)
      expect(overrideData.co2f).toBe(6)
      expect(overrideData.sf6).toBe(7)
      expect(overrideData.otherGES).toBe(4)
      expect(overrideData.overrideRawCsv).toContain('Type_poste')
      expect(overrideData.metaData).toEqual({
        updateMany: expect.arrayContaining([
          expect.objectContaining({
            where: { emissionFactorPartId: 'part-id', language: 'fr' },
            data: { title: 'Nom poste FR' },
          }),
          expect.objectContaining({
            where: { emissionFactorPartId: 'part-id', language: 'en' },
            data: { title: 'Part name EN' },
          }),
        ]),
      })
    })
  })
})
