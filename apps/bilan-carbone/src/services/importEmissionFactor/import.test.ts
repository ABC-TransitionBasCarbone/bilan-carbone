import { EmissionFactorBase, Environment, Import, SubPost } from '@abc-transitionbascarbone/db-common/enums'
import { expect } from '@jest/globals'
import { getBaseFunc, getSubPosts, ImportEmissionFactor, isSourceForEnv } from './import'

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
})
