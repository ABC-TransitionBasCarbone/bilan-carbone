import { FullStudy } from '@/db/study'
import { getMockedFullStudyEmissionSource } from '@/tests/utils/models/emissionSource'
import { getMockeFullStudy } from '@/tests/utils/models/study'
import { translationMock } from '@/tests/utils/models/translationsMock'
import * as studyUtilsModule from '@/utils/study'
import { expect } from '@jest/globals'
import { Environment, SubPost } from '@prisma/client'
import { computeResultsByTag } from './consolidated'

// TODO : remove these mocks. Should not be mocked but tests fail if not
jest.mock('../file', () => ({ download: jest.fn() }))
jest.mock('../auth', () => ({ auth: jest.fn() }))

jest.mock('../permissions/study', () => ({ canReadStudy: jest.fn() }))
jest.mock('../../utils/study', () => ({ getAccountRoleOnStudy: jest.fn(), hasDeprecationPeriod: jest.fn() }))
jest.mock('next-intl/server', () => ({
  getTranslations: jest.fn(() => (key: string) => key),
}))
const mockHasDeprecationPeriod = studyUtilsModule.hasDeprecationPeriod as jest.Mock

const tags = [
  { id: 'test', name: 'test', familyId: 'familyTag1', color: '#000000', createdAt: new Date(), updatedAt: new Date() },
  {
    id: 'test2',
    name: 'test2',
    familyId: 'familyTag1',
    color: '#000000',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'test3',
    name: 'test3',
    familyId: 'familyTag1',
    color: '#000000',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'test4',
    name: 'test4',
    familyId: 'familyTag1',
    color: '#000000',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'test21',
    name: 'test21',
    familyId: 'familyTag2',
    color: '#000000',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'test22',
    name: 'test22',
    familyId: 'familyTag2',
    color: '#000000',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'test23',
    name: 'test23',
    familyId: 'familyTag2',
    color: '#000000',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'test24',
    name: 'test24',
    familyId: 'familyTag2',
    color: '#000000',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'test31',
    name: 'test31',
    familyId: 'familyTag3',
    color: '#000000',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'test32',
    name: 'test32',
    familyId: 'familyTag3',
    color: '#000000',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'test34',
    name: 'test33',
    familyId: 'familyTag3',
    color: '#000000',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

const tagFamilies = [
  { id: 'familyTag1', name: 'Family Tag 1', tags: [tags[0], tags[1], tags[2], tags[3]] },
  { id: 'familyTag2', name: 'Family Tag 2', tags: [tags[4], tags[5], tags[6], tags[7]] },
  { id: 'familyTag3', name: 'Family Tag 3', tags: [tags[8], tags[9], tags[10]] },
]

const studySite = { id: 'mocked-study-site-id', site: { name: 'Mocked Site', id: 'mocked-site-id' } }

describe('consolidated function', () => {
  describe('computeResultsByTag', () => {
    beforeEach(() => {
      mockHasDeprecationPeriod.mockReturnValue(false)
    })

    test('should format value and unit correctly', () => {
      const emissionSources = [
        getMockedFullStudyEmissionSource({
          validated: true,
          studySite,
          tagLinks: [tags[0], tags[4], tags[8]].map((tag) => ({ tag })),
          value: 100,
          reliability: 3,
          technicalRepresentativeness: 3,
          geographicRepresentativeness: 2,
          temporalRepresentativeness: 5,
          completeness: 4,
        }),
        getMockedFullStudyEmissionSource({
          validated: true,
          studySite,
          tagLinks: [tags[1]].map((tag) => ({ tag })),
          value: 45,
        }),
        getMockedFullStudyEmissionSource({
          validated: true,
          studySite,
          tagLinks: [tags[1]].map((tag) => ({ tag })),
          subPost: SubPost.UtilisationEnDependance,
          value: 10,
        }),
        getMockedFullStudyEmissionSource({
          studySite,
          tagLinks: [tags[1]].map((tag) => ({ tag })),
          value: 45,
          validated: false,
        }),
        getMockedFullStudyEmissionSource({
          validated: true,
          studySite,
          tagLinks: [tags[1], tags[4]].map((tag) => ({ tag })),
          value: 50,
        }),
        getMockedFullStudyEmissionSource({ validated: true, studySite, tagLinks: [], value: 80 }),
        getMockedFullStudyEmissionSource({ validated: true, studySite, tagLinks: [], value: 0 }),
        getMockedFullStudyEmissionSource({
          validated: true,
          studySite,
          emissionFactor: null,
          emissionFactorId: null,
          tagLinks: [tags[1]].map((tag) => ({ tag })),
          value: 0,
        }),
      ]

      const study = getMockeFullStudy({ emissionSources, tagFamilies })

      const result = computeResultsByTag(
        study,
        studySite.id,
        false,
        true,
        Environment.BC,
        translationMock({ other: 'other' }),
      )

      expect(result).toEqual([
        {
          familyId: 'familyTag1',
          label: 'Family Tag 1',
          value: 1950,
          uncertainty: 1.1150550922754328,
          children: [
            {
              label: 'test',
              tagFamily: 'familyTag1',
              value: 1000,
              color: '#000000',
              uncertainty: 1.2365959919080918,
            },
            {
              label: 'test2',
              tagFamily: 'familyTag1',
              value: 950,
              color: '#000000',
              uncertainty: 1,
            },
          ],
        },
        {
          familyId: 'familyTag2',
          label: 'Family Tag 2',
          value: 1500,
          uncertainty: 1.1520868590878348,
          children: [
            {
              label: 'test21',
              tagFamily: 'familyTag2',
              value: 1500,
              color: '#000000',
              uncertainty: 1.1520868590878348,
            },
          ],
        },
        {
          familyId: 'familyTag3',
          label: 'Family Tag 3',
          value: 1000,
          uncertainty: 1.2365959919080918,
          children: [
            {
              label: 'test31',
              tagFamily: 'familyTag3',
              value: 1000,
              color: '#000000',
              uncertainty: 1.2365959919080918,
            },
          ],
        },
        {
          label: 'other',
          familyId: 'otherFamily',
          value: 800,
          uncertainty: 1,
          children: [{ label: 'other', tagFamily: 'otherFamily', value: 800, color: '', uncertainty: 1 }],
        },
      ])
    })

    test('should format value and unit correctly with dependence and with non validated emissions', () => {
      const emissionSources = [
        getMockedFullStudyEmissionSource({
          validated: true,
          studySite,
          tagLinks: [tags[0], tags[4], tags[8]].map((tag) => ({ tag })),
          value: 100,
        }),
        getMockedFullStudyEmissionSource({
          validated: true,
          studySite,
          tagLinks: [tags[1]].map((tag) => ({ tag })),
          value: 45,
        }),
        getMockedFullStudyEmissionSource({
          validated: true,
          studySite,
          tagLinks: [tags[1]].map((tag) => ({ tag })),
          value: 10,
          subPost: SubPost.UtilisationEnDependance,
        }),
        getMockedFullStudyEmissionSource({
          studySite,
          tagLinks: [tags[1]].map((tag) => ({ tag })),
          value: 45,
          validated: false,
        }),
        getMockedFullStudyEmissionSource({
          validated: true,
          studySite,
          tagLinks: [tags[1], tags[4]].map((tag) => ({ tag })),
          value: 50,
        }),
        getMockedFullStudyEmissionSource({ validated: true, studySite, tagLinks: [], value: 80 }),
        getMockedFullStudyEmissionSource({ validated: true, studySite, tagLinks: [], value: 0 }),
        getMockedFullStudyEmissionSource({
          validated: true,
          studySite,
          emissionFactor: null,
          emissionFactorId: null,
          tagLinks: [tags[1]].map((tag) => ({ tag })),
          value: 450,
        }),
      ]

      const study = getMockeFullStudy({ emissionSources, tagFamilies })

      const result = computeResultsByTag(
        study,
        studySite.id,
        true,
        false,
        Environment.BC,
        translationMock({ other: 'other' }),
      )

      expect(result).toEqual([
        {
          familyId: 'familyTag1',
          label: 'Family Tag 1',
          value: 2500,
          uncertainty: 1,
          children: [
            {
              label: 'test',
              tagFamily: 'familyTag1',
              value: 1000,
              color: '#000000',
              uncertainty: 1,
            },
            {
              label: 'test2',
              tagFamily: 'familyTag1',
              value: 1500,
              color: '#000000',
              uncertainty: 1,
            },
          ],
        },
        {
          familyId: 'familyTag2',
          label: 'Family Tag 2',
          value: 1500,
          uncertainty: 1,
          children: [
            {
              label: 'test21',
              tagFamily: 'familyTag2',
              value: 1500,
              color: '#000000',
              uncertainty: 1,
            },
          ],
        },
        {
          familyId: 'familyTag3',
          label: 'Family Tag 3',
          value: 1000,
          uncertainty: 1,
          children: [
            {
              label: 'test31',
              tagFamily: 'familyTag3',
              value: 1000,
              color: '#000000',
              uncertainty: 1,
            },
          ],
        },
        {
          label: 'other',
          familyId: 'otherFamily',
          value: 800,
          uncertainty: 1,
          children: [{ label: 'other', tagFamily: 'otherFamily', value: 800, color: '', uncertainty: 1 }],
        },
      ])
    })

    test('should handle empty value', () => {
      const emissionSources = [] as FullStudy['emissionSources']

      const study = getMockeFullStudy({ emissionSources, tagFamilies })

      const result = computeResultsByTag(
        study,
        studySite.id,
        true,
        false,
        Environment.BC,
        translationMock({ other: 'other' }),
      )

      expect(result).toEqual([])
    })
  })
})
