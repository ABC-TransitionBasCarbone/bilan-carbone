import { FullStudy } from '@/db/study'
import {
  COMMON_DATES,
  getMockedDetailedFullStudySite,
  getMockedFormSite,
  getMockedFullStudy,
} from '@/tests/utils/models/study'
import { getMockedAuthUser } from '@/tests/utils/models/user'
import { expect } from '@jest/globals'
import { ControlMode, Export, Level, SiteCAUnit, StudyResultUnit } from '@prisma/client'
import dayjs from 'dayjs'
import { createDuplicateFormData, updateSitesFromSourceStudy } from './useDuplicateStudy'

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

jest.mock('@/hooks/useServerFunction', () => ({
  useServerFunction: () => ({
    callServerFunction: jest.fn(),
  }),
}))

jest.mock('@/services/serverFunctions/study', () => ({
  getStudy: jest.fn(),
}))

const MOCK_USER = getMockedAuthUser({ email: 'validator@example.com' })
const MOCK_TRANSLATION = (key: string) => (key === 'duplicateCopy' ? ' - Copy' : key)

const expectSiteToMatch = (actual: Record<string, unknown>, expected: Record<string, unknown>) => {
  Object.keys(expected).forEach((key) => {
    expect(actual[key]).toBe(expected[key])
  })
}

const expectFormDataToMatch = (actual: Record<string, unknown>, sourceStudy: FullStudy, user: { email: string }) => {
  expect(actual.name).toBe(`${sourceStudy.name} - Copy`)
  expect(actual.validator).toBe(user.email)
  expect(actual.isPublic).toBe(sourceStudy.isPublic ? 'true' : 'false')
  expect(actual.resultsUnit).toBe(sourceStudy.resultsUnit)
  expect(actual.level).toBe(sourceStudy.level)
  expect(actual.organizationVersionId).toBe(sourceStudy.organizationVersionId)
}

const expectDateFieldsToMatch = (actual: Record<string, unknown>, sourceStudy: FullStudy) => {
  expect(actual.startDate).toBe(dayjs(sourceStudy.startDate).toISOString())
  expect(actual.endDate).toBe(dayjs(sourceStudy.endDate).toISOString())
  expect(actual.realizationStartDate).toBe(dayjs(sourceStudy.realizationStartDate).toISOString())
  expect(actual.realizationEndDate).toBe(dayjs(sourceStudy.realizationEndDate).toISOString())
}

describe('useDuplicateStudy utility functions', () => {
  describe('updateSitesFromSourceStudy', () => {
    it('should select and populate sites that exist in source study', () => {
      const caUnit = SiteCAUnit.K
      const formSites = [
        getMockedFormSite('site-1', 'Site A'),
        getMockedFormSite('site-2', 'Site B'),
        getMockedFormSite('site-3', 'Site C (not in original)'),
      ]

      const sourceStudy: FullStudy = {
        ...getMockedFullStudy(),
        sites: [
          getMockedDetailedFullStudySite('site-1', 'study-site-1', 'Site A', { etp: 15, ca: 100000 }),
          getMockedDetailedFullStudySite('site-2', 'study-site-2', 'Site B', { etp: 25, ca: 200000 }),
        ],
        emissionSources: [
          ...Array(3)
            .fill(null)
            .map(() => ({ studySite: { id: 'study-site-1' } })),
          ...Array(2)
            .fill(null)
            .map(() => ({ studySite: { id: 'study-site-2' } })),
        ] as FullStudy['emissionSources'],
      }

      const result = updateSitesFromSourceStudy(formSites, sourceStudy, caUnit)

      // Sites in source study should be selected and populated
      expectSiteToMatch(result[0], {
        id: 'site-1',
        name: 'Site A',
        selected: true,
        ca: 100,
        etp: 15,
        emissionSourcesCount: 3,
      })

      expectSiteToMatch(result[1], {
        id: 'site-2',
        name: 'Site B',
        selected: true,
        ca: 200,
        etp: 25,
        emissionSourcesCount: 2,
      })

      // Sites not in source study should remain unselected
      expectSiteToMatch(result[2], {
        id: 'site-3',
        name: 'Site C (not in original)',
        selected: false,
        ca: 0,
        etp: 0,
        emissionSourcesCount: 0,
      })
    })

    it('should handle empty source study', () => {
      const caUnit = SiteCAUnit.K
      const formSites = [getMockedFormSite('site-1', 'Site A')]
      const sourceStudy: FullStudy = {
        ...getMockedFullStudy(),
        sites: [],
        emissionSources: [],
      }

      const result = updateSitesFromSourceStudy(formSites, sourceStudy, caUnit)

      expectSiteToMatch(result[0], {
        id: 'site-1',
        name: 'Site A',
        selected: false,
        ca: 0,
        etp: 0,
        emissionSourcesCount: 0,
      })
    })
  })

  describe('createDuplicateFormData', () => {
    it('should populate all form fields from source study', () => {
      const sourceStudy = getMockedFullStudy({
        name: 'Original Study Name',
        isPublic: true,
        ...COMMON_DATES,
        level: Level.Advanced,
        resultsUnit: StudyResultUnit.K,
        exports: {
          types: [Export.Beges, Export.GHGP],
          control: ControlMode.Operational,
        },
      })

      const result = createDuplicateFormData(sourceStudy, MOCK_USER, MOCK_TRANSLATION, [])

      // Basic fields
      expectFormDataToMatch(result, sourceStudy, MOCK_USER)
      expectDateFieldsToMatch(result, sourceStudy)

      // Exports
      expect(result.exports).toContain(Export.Beges)
      expect(result.exports).toContain(Export.GHGP)
      expect(result.exports).not.toContain(Export.ISO14069)
      expect(result.controlMode).toBe(ControlMode.Operational)
    })

    it('should handle missing optional fields gracefully', () => {
      const sourceStudyWithMissingFields = getMockedFullStudy({
        name: 'Study With Missing Fields',
        isPublic: false,
        startDate: COMMON_DATES.startDate,
        endDate: COMMON_DATES.endDate,
        realizationStartDate: null,
        realizationEndDate: null,
        level: Level.Advanced,
        resultsUnit: undefined,
        organizationVersionId: 'org-version-123',
        exports: { types: [], control: null },
      })

      const result = createDuplicateFormData(sourceStudyWithMissingFields, MOCK_USER, MOCK_TRANSLATION, [])

      expect(result.realizationStartDate).toBeDefined()
      expect(new Date(result.realizationStartDate).getTime()).toBeCloseTo(new Date().getTime(), -2)
      expect(result.realizationEndDate).toBe(null)
      expect(result.resultsUnit).toBe(sourceStudyWithMissingFields.resultsUnit)
    })
  })
})
