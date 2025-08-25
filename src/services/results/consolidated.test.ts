import { FullStudy } from '@/db/study'
import { getMockedFullStudyEmissionSource } from '@/tests/utils/models/emissionSource'
import { getMockeFullStudy } from '@/tests/utils/models/study'
import { translationMock } from '@/tests/utils/models/translationsMock'
import { expect } from '@jest/globals'
import { Environment, SubPost } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { computeResultsByTag } from './consolidated'

// TODO : remove these mocks. Should not be mocked but tests fail if not
jest.mock('../file', () => ({ download: jest.fn() }))
jest.mock('../auth', () => ({ auth: jest.fn() }))

jest.mock('../permissions/study', () => ({ canReadStudy: jest.fn() }))
jest.mock('../../utils/study', () => ({ getAccountRoleOnStudy: jest.fn() }))
jest.mock('next-intl/server', () => ({
  getTranslations: jest.fn(() => (key: string) => key),
}))

const tags = [
  { id: 'test', name: 'test', familyId: 'familyTag1', color: '#000000' },
  { id: 'test2', name: 'test2', familyId: 'familyTag1', color: '#000000' },
  { id: 'test3', name: 'test3', familyId: 'familyTag1', color: '#000000' },
  { id: 'test4', name: 'test4', familyId: 'familyTag1', color: '#000000' },
  { id: 'test21', name: 'test21', familyId: 'familyTag2', color: '#000000' },
  { id: 'test22', name: 'test22', familyId: 'familyTag2', color: '#000000' },
  { id: 'test23', name: 'test23', familyId: 'familyTag2', color: '#000000' },
  { id: 'test24', name: 'test24', familyId: 'familyTag2', color: '#000000' },
  { id: 'test31', name: 'test31', familyId: 'familyTag3', color: '#000000' },
  { id: 'test32', name: 'test32', familyId: 'familyTag3', color: '#000000' },
  { id: 'test34', name: 'test33', familyId: 'familyTag3', color: '#000000' },
]

const emissionSourceTagFamilies = [
  { id: 'familyTag1', name: 'Family Tag 1', emissionSourceTags: [tags[0], tags[1], tags[2], tags[3]] },
  { id: 'familyTag2', name: 'Family Tag 2', emissionSourceTags: [tags[4], tags[5], tags[6], tags[7]] },
  { id: 'familyTag3', name: 'Family Tag 3', emissionSourceTags: [tags[8], tags[9], tags[10]] },
]

const studySite = { id: 'mocked-study-site-id', site: { name: 'Mocked Site', id: 'mocked-site-id' } }

describe('consolidated function', () => {
  describe('computeResultsByTag', () => {
    test('should format value and unit correctly', () => {
      const emissionSources = [
        getMockedFullStudyEmissionSource({
          validated: true,
          studySite,
          emissionSourceTags: [tags[0], tags[4], tags[8]],
          value: 100,
        }),
        getMockedFullStudyEmissionSource({ validated: true, studySite, emissionSourceTags: [tags[1]], value: 45 }),
        getMockedFullStudyEmissionSource({
          validated: true,
          studySite,
          emissionSourceTags: [tags[1]],
          subPost: SubPost.UtilisationEnDependance,
          value: 10,
        }),
        getMockedFullStudyEmissionSource({ studySite, emissionSourceTags: [tags[1]], value: 45, validated: false }),
        getMockedFullStudyEmissionSource({
          validated: true,
          studySite,
          emissionSourceTags: [tags[1], tags[4]],
          value: 50,
        }),
        getMockedFullStudyEmissionSource({ validated: true, studySite, emissionSourceTags: [], value: 80 }),
        getMockedFullStudyEmissionSource({ validated: true, studySite, emissionSourceTags: [], value: 0 }),
        getMockedFullStudyEmissionSource({
          validated: true,
          studySite,
          emissionFactor: null,
          emissionFactorId: null,
          emissionSourceTags: [tags[1]],
          value: 0,
        }),
      ]

      const study = getMockeFullStudy({ emissionSources, emissionSourceTagFamilies })

      const result = computeResultsByTag(
        study,
        studySite.id,
        false,
        true,
        Environment.BC,
        translationMock({ other: 'other' }) as ReturnType<typeof useTranslations>,
      )

      expect(result).toEqual([
        {
          label: 'test',
          tagFamily: { id: 'familyTag1', name: 'Family Tag 1' },
          value: 1000,
          color: '#000000',
        },
        {
          label: 'test2',
          tagFamily: { id: 'familyTag1', name: 'Family Tag 1' },
          value: 950,
          color: '#000000',
        },
        {
          label: 'test21',
          tagFamily: { id: 'familyTag2', name: 'Family Tag 2' },
          value: 1500,
          color: '#000000',
        },
        {
          label: 'test31',
          tagFamily: { id: 'familyTag3', name: 'Family Tag 3' },
          value: 1000,
          color: '#000000',
        },
        {
          label: 'other',
          tagFamily: { name: 'other', id: 'other' },
          value: 800,
          color: '',
        },
      ])
    })

    test('should format value and unit correctly with dependence and with non validated emissions', () => {
      const emissionSources = [
        getMockedFullStudyEmissionSource({
          validated: true,
          studySite,
          emissionSourceTags: [tags[0], tags[4], tags[8]],
          value: 100,
        }),
        getMockedFullStudyEmissionSource({ validated: true, studySite, emissionSourceTags: [tags[1]], value: 45 }),
        getMockedFullStudyEmissionSource({
          validated: true,
          studySite,
          emissionSourceTags: [tags[1]],
          value: 10,
          subPost: SubPost.UtilisationEnDependance,
        }),
        getMockedFullStudyEmissionSource({
          studySite,
          emissionSourceTags: [tags[1]],
          value: 45,
          validated: false,
        }),
        getMockedFullStudyEmissionSource({
          validated: true,
          studySite,
          emissionSourceTags: [tags[1], tags[4]],
          value: 50,
        }),
        getMockedFullStudyEmissionSource({ validated: true, studySite, emissionSourceTags: [], value: 80 }),
        getMockedFullStudyEmissionSource({ validated: true, studySite, emissionSourceTags: [], value: 0 }),
        getMockedFullStudyEmissionSource({
          validated: true,
          studySite,
          emissionFactor: null,
          emissionFactorId: null,
          emissionSourceTags: [tags[1]],
          value: 450,
        }),
      ]

      const study = getMockeFullStudy({ emissionSources, emissionSourceTagFamilies })

      const result = computeResultsByTag(
        study,
        studySite.id,
        true,
        false,
        Environment.BC,
        translationMock({ other: 'other' }) as ReturnType<typeof useTranslations>,
      )

      expect(result).toEqual([
        {
          label: 'test',
          tagFamily: { id: 'familyTag1', name: 'Family Tag 1' },
          value: 1000,
          color: '#000000',
        },
        {
          label: 'test2',
          tagFamily: { id: 'familyTag1', name: 'Family Tag 1' },
          value: 1500,
          color: '#000000',
        },
        {
          label: 'test21',
          tagFamily: { id: 'familyTag2', name: 'Family Tag 2' },
          value: 1500,
          color: '#000000',
        },
        {
          label: 'test31',
          tagFamily: { id: 'familyTag3', name: 'Family Tag 3' },
          value: 1000,
          color: '#000000',
        },
        {
          label: 'other',
          tagFamily: { name: 'other', id: 'other' },
          value: 800,
          color: '',
        },
      ])
    })

    test('should handle empty value', () => {
      const emissionSources = [] as FullStudy['emissionSources']

      const study = getMockeFullStudy({ emissionSources, emissionSourceTagFamilies })

      const result = computeResultsByTag(
        study,
        studySite.id,
        true,
        false,
        Environment.BC,
        translationMock({ other: 'other' }) as ReturnType<typeof useTranslations>,
      )

      expect(result).toEqual([])
    })
  })
})
