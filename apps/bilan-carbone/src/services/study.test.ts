import { getMockedFullStudyEmissionSource } from '@/tests/utils/models/emissionSource'
import { getMockeFullStudy, getMockedDetailedFullStudySite } from '@/tests/utils/models/study'
import type { Translations } from '@/types/translation'
import { hasSufficientLevel } from '@/utils/study'
import { expect } from '@jest/globals'
import { Environment, Level, StudyResultUnit, SubPost } from '@repo/db-common/enums'
import { prepareExcel } from './serverFunctions/file'
import { downloadStudyResults, getStudyTotalCo2Emissions, getTransEnvironmentSubPost } from './study'

// TODO : remove these mocks. Should not be mocked but tests fail if not
jest.mock('./file', () => ({ download: jest.fn() }))
jest.mock('./auth', () => ({ auth: jest.fn() }))
jest.mock('uuid', () => ({ v4: jest.fn() }))
jest.mock('next-intl/server', () => ({ getTranslations: jest.fn(() => (key: string) => key) }))
jest.mock('./serverFunctions/file', () => ({ prepareExcel: jest.fn(async () => new ArrayBuffer(0)) }))
jest.mock('./serverFunctions/user', () => ({
  getUserSettings: jest.fn(async () => ({ success: true, data: { validatedEmissionSourcesOnly: false } })),
}))

describe('Study Service', () => {
  describe('getTransEnvironmentSubPost', () => {
    it('Should return same subPost for iso-environments', () => {
      Object.values(SubPost).forEach((subPost) => {
        expect(getTransEnvironmentSubPost(Environment.BC, Environment.BC, subPost)).toBe(subPost)
        expect(getTransEnvironmentSubPost(Environment.CUT, Environment.CUT, subPost)).toBe(subPost)
        expect(getTransEnvironmentSubPost(Environment.TILT, Environment.TILT, subPost)).toBe(subPost)
      })
    })

    it('Should return undefined for CUT environment', () => {
      Object.values(SubPost).forEach((subPost) => {
        expect(getTransEnvironmentSubPost(Environment.BC, Environment.CUT, subPost)).toBe(undefined)
        expect(getTransEnvironmentSubPost(Environment.CUT, Environment.BC, subPost)).toBe(undefined)
        expect(getTransEnvironmentSubPost(Environment.TILT, Environment.CUT, subPost)).toBe(undefined)
        expect(getTransEnvironmentSubPost(Environment.CUT, Environment.TILT, subPost)).toBe(undefined)
      })
    })

    it('BC to Tilt environment', () => {
      const source = Environment.BC
      const target = Environment.TILT
      expect(getTransEnvironmentSubPost(source, target, SubPost.DeplacementsDomicileTravail)).toBe(
        SubPost.DeplacementsDomicileTravailSalaries,
      )
      expect(getTransEnvironmentSubPost(source, target, SubPost.DeplacementsProfessionnels)).toBe(
        SubPost.DeplacementsDansLeCadreDUneMissionAssociativeSalaries,
      )
      expect(getTransEnvironmentSubPost(source, target, SubPost.Electricite)).toBe(SubPost.Electricite)
      expect(getTransEnvironmentSubPost(source, target, SubPost.Equipements)).toBe(SubPost.EquipementsDesSalaries)
      expect(getTransEnvironmentSubPost(source, target, SubPost.Informatique)).toBe(SubPost.ParcInformatiqueDesSalaries)
      expect(getTransEnvironmentSubPost(source, target, SubPost.NourritureRepasBoissons)).toBe(
        SubPost.RepasPrisParLesSalaries,
      )
      expect(getTransEnvironmentSubPost(source, target, SubPost.UtilisationEnDependance)).toBe(
        SubPost.UtilisationEnDependanceConsommationDeBiens,
      )
      expect(getTransEnvironmentSubPost(source, target, SubPost.UtilisationEnResponsabilite)).toBe(
        SubPost.UtilisationEnDependanceConsommationDeBiens,
      )
    })

    it('Tilt to BC environment', () => {
      const source = Environment.TILT
      const target = Environment.BC
      expect(getTransEnvironmentSubPost(source, target, SubPost.DeplacementsDomicileTravailSalaries)).toBe(
        SubPost.DeplacementsDomicileTravail,
      )
      expect(getTransEnvironmentSubPost(source, target, SubPost.TeletravailSalaries)).toBe(SubPost.Electricite)
      expect(getTransEnvironmentSubPost(source, target, SubPost.Electricite)).toBe(SubPost.Electricite)
    })
  })

  describe('getStudyTotalCo2EmissionsWithDep', () => {
    it('Should return total CO2 in K unit', () => {
      const mockStudy = getMockeFullStudy({
        resultsUnit: StudyResultUnit.K,
        organizationVersion: {
          environment: Environment.BC,
        },
        emissionSources: [
          getMockedFullStudyEmissionSource({
            value: 1000,
            validated: true,
          }),
          getMockedFullStudyEmissionSource({
            value: 2000,
            validated: true,
          }),
        ],
      })

      const result = getStudyTotalCo2Emissions(mockStudy, true, true)

      expect(result).toBe(30000) // Mocked FE has a totalCo2 of 10
    })

    it('Should return total CO2 in T unit', () => {
      const mockStudy = getMockeFullStudy({
        resultsUnit: StudyResultUnit.T,
        emissionSources: [
          getMockedFullStudyEmissionSource({
            value: 1000,
            validated: true,
          }),
          getMockedFullStudyEmissionSource({
            value: 2000,
            validated: true,
          }),
        ],
      })

      const result = getStudyTotalCo2Emissions(mockStudy, true, true)

      expect(result).toBe(30) // Mocked FE has a totalCo2 of 10
    })

    it('Should return 0 when no emission sources', () => {
      const mockStudy = getMockeFullStudy({
        resultsUnit: StudyResultUnit.T,
        emissionSources: [],
      })

      const result = getStudyTotalCo2Emissions(mockStudy, true, true)

      expect(result).toBe(0)
    })

    it('Should not return total CO2 in T unit when sources not validated and validated only is true', () => {
      const mockStudy = getMockeFullStudy({
        resultsUnit: StudyResultUnit.T,
        emissionSources: [getMockedFullStudyEmissionSource({ value: 1000, validated: false })],
      })

      const result = getStudyTotalCo2Emissions(mockStudy, true, true)

      expect(result).toBe(0)
    })

    it('Should return total CO2 only from validated sources when validated only is true', () => {
      const mockStudy = getMockeFullStudy({
        resultsUnit: StudyResultUnit.T,
        emissionSources: [
          getMockedFullStudyEmissionSource({ value: 1000, validated: true }),
          getMockedFullStudyEmissionSource({ value: 2000, validated: false }),
          getMockedFullStudyEmissionSource({ value: 3000, validated: false }),
        ],
      })

      const result = getStudyTotalCo2Emissions(mockStudy, true, true)

      expect(result).toBe(10)
    })

    it('Should return total CO2 in T unit when sources not validated and validated only is false', () => {
      const mockStudy = getMockeFullStudy({
        resultsUnit: StudyResultUnit.K,
        emissionSources: [getMockedFullStudyEmissionSource({ value: 1000, validated: false })],
      })

      const result = getStudyTotalCo2Emissions(mockStudy, true, false)

      expect(result).toBe(10000) // Mocked FE has a totalCo2 of 10
    })
  })

  describe('hasSufficientLevel', () => {
    it('Should return true if userLevel is sufficient', () => {
      expect(hasSufficientLevel(Level.Advanced, Level.Initial)).toBe(true)
      expect(hasSufficientLevel(Level.Advanced, Level.Standard)).toBe(true)
      expect(hasSufficientLevel(Level.Advanced, Level.Advanced)).toBe(true)

      expect(hasSufficientLevel(Level.Standard, Level.Standard)).toBe(true)
      expect(hasSufficientLevel(Level.Standard, Level.Initial)).toBe(true)

      expect(hasSufficientLevel(Level.Initial, Level.Initial)).toBe(true)
    })

    it('Should return false if userLevel is not sufficient', () => {
      expect(hasSufficientLevel(Level.Initial, Level.Standard)).toBe(false)
      expect(hasSufficientLevel(Level.Initial, Level.Advanced)).toBe(false)

      expect(hasSufficientLevel(Level.Standard, Level.Advanced)).toBe(false)
    })

    it('Should return false if userLevel is null', () => {
      expect(hasSufficientLevel(null, Level.Initial)).toBe(false)
      expect(hasSufficientLevel(null, Level.Standard)).toBe(false)
      expect(hasSufficientLevel(null, Level.Advanced)).toBe(false)
    })
  })

  describe('downloadStudyResults', () => {
    it('should correctly ventilate consolidated results by site using appropriate ID types', async () => {
      const study = getMockeFullStudy({
        organizationVersion: { environment: Environment.BC },
        sites: [
          getMockedDetailedFullStudySite('site-a', 'study-site-a', 'Site A'),
          getMockedDetailedFullStudySite('site-b', 'study-site-b', 'Site B'),
        ],
        emissionSources: [
          getMockedFullStudyEmissionSource({
            value: 1,
            validated: true,
            studySite: { id: 'study-site-a', site: { id: 'site-a', name: 'Site A' } },
          }),
          getMockedFullStudyEmissionSource({
            value: 2,
            validated: true,
            studySite: { id: 'study-site-b', site: { id: 'site-b', name: 'Site B' } },
          }),
        ],
      })

      const t = ((key: string) => key) as unknown as Translations

      const prepareExcelMock = jest.mocked(prepareExcel)
      prepareExcelMock.mockClear()
      await downloadStudyResults(study, [], [], [], t, t, t, t, t, t, t, t, t, Environment.BC)

      expect(prepareExcelMock).toHaveBeenCalledTimes(1)
      expect(prepareExcelMock).toHaveBeenCalledWith(expect.any(Array))

      const [exportedData] = prepareExcelMock.mock.calls[0]
      const consolidatedSheet = (exportedData as { data: (string | number)[][] }[])[0]
      const rows = consolidatedSheet.data

      const findSiteTotalRow = (siteName: string) => {
        const siteRowIndex = rows.findIndex((row) => row[0] === siteName)
        return siteRowIndex >= 0 ? rows.slice(siteRowIndex).find((row) => row[0] === 'total') : undefined
      }

      // BC export row layout: [label, '', uncertainty, co2Value, confidenceInterval]
      // co2Value is at index 3 (index 2 is the uncertainty/quality score)
      const getTotalCo2Value = (siteName: string) => {
        const totalRow = findSiteTotalRow(siteName)
        if (!totalRow) {
          throw new Error(`Missing total row for ${siteName}`)
        }
        return totalRow[3] as number
      }

      // emissionFactor.totalCo2=10; value=1 → 10 kg → 10 K; value=2 → 20 K
      expect(getTotalCo2Value('Site A')).toBe(10)
      expect(getTotalCo2Value('Site B')).toBe(20)
      expect(getTotalCo2Value('allSites')).toBe(30)
    })
  })
})
