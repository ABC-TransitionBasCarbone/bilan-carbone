import { getMockedFullStudyEmissionSource } from '@/tests/utils/models/emissionSource'
import { getMockeFullStudy, mockedEmissionSourceEmissionFactor } from '@/tests/utils/models/study'
import { getActionReductionRatio, getUIFilteredEmissions } from '@/utils/study'
import { expect } from '@jest/globals'
import { StudyResultUnit, SubPost } from '@prisma/client'

jest.mock('../file', () => ({ download: jest.fn() }))
jest.mock('../auth', () => ({ auth: jest.fn() }))
jest.mock('uuid', () => ({ v4: jest.fn() }))
jest.mock('next-intl/server', () => ({ getTranslations: jest.fn(() => (key: string) => key) }))

const makeSource = (
  subPost: SubPost,
  totalCo2Kg: number,
  validated = true,
  siteId = 'site-a',
  studySiteId = 'study-site-a',
  tagIds: string[] = [],
) =>
  getMockedFullStudyEmissionSource({
    subPost,
    validated,
    studySite: { id: studySiteId, site: { id: siteId, name: siteId } },
    emissionFactor: { ...mockedEmissionSourceEmissionFactor, totalCo2: totalCo2Kg },
    emissionSourceTags: tagIds.map((id) => ({
      tag: { id, name: id, color: null, familyId: 'family-id', createdAt: new Date(), updatedAt: new Date() },
    })),
    value: 1,
  })

const makeStudy = (sources: ReturnType<typeof makeSource>[]) =>
  getMockeFullStudy({ emissionSources: sources, resultsUnit: StudyResultUnit.K })

describe('emission scope filtering', () => {
  describe('getActionReductionRatio', () => {
    const mockSource = (
      subPost: SubPost,
      totalCo2Kg: number,
      siteId = 'site-a',
      studySiteId = 'study-site-a',
      tagIds: string[] = [],
    ) => makeSource(subPost, totalCo2Kg, true, siteId, studySiteId, tagIds)

    const mockStudy = (sources: ReturnType<typeof mockSource>[]) => makeStudy(sources)

    it('returns 1 when no UI filters are active', () => {
      const study = mockStudy([mockSource(SubPost.Achats, 100), mockSource(SubPost.Electricite, 200)])
      const ratio = getActionReductionRatio(study, false, [], [SubPost.Achats, SubPost.Electricite], [], [], [], [])
      expect(ratio).toBe(1)
    })

    it('returns correct ratio when filtering on one of multiple subposts', () => {
      const study = mockStudy([mockSource(SubPost.Achats, 100), mockSource(SubPost.Electricite, 300)])
      const ratio = getActionReductionRatio(
        study,
        false,
        [],
        [SubPost.Achats, SubPost.Electricite],
        [],
        [],
        [SubPost.Achats],
        [],
      )

      expect(ratio).toBeCloseTo(100 / 400)
    })

    it('returns 1 when all subposts are selected by filter', () => {
      const study = mockStudy([mockSource(SubPost.Achats, 100), mockSource(SubPost.Electricite, 300)])
      const ratio = getActionReductionRatio(
        study,
        false,
        [],
        [SubPost.Achats, SubPost.Electricite],
        [],
        [],
        [SubPost.Achats, SubPost.Electricite],
        [],
      )
      expect(ratio).toBe(1)
    })

    it('returns correct ratio when action has empty siteIds (= all sites) and filter targets one site', () => {
      const study = mockStudy([
        mockSource(SubPost.Achats, 100, 'site-a', 'study-site-a'),
        mockSource(SubPost.Achats, 300, 'site-b', 'study-site-b'),
      ])

      const ratio = getActionReductionRatio(study, false, [], [SubPost.Achats], [], ['site-a'], [SubPost.Achats], [])
      expect(ratio).toBe(100 / 400)
    })

    it('returns correct ratio combining site, subpost and tag filters', () => {
      const study = mockStudy([
        mockSource(SubPost.Achats, 200, 'site-a', 'study-site-a', ['tag-1']),
        mockSource(SubPost.Achats, 200, 'site-a', 'study-site-a', ['tag-2']),
        mockSource(SubPost.Electricite, 100, 'site-a', 'study-site-a', ['tag-1']),
        mockSource(SubPost.Achats, 500, 'site-b', 'study-site-b', ['tag-1']),
      ])
      const ratio = getActionReductionRatio(
        study,
        false,
        ['site-a'],
        [SubPost.Achats, SubPost.Electricite],
        ['tag-1'],
        ['site-a'],
        [SubPost.Achats],
        ['tag-1'],
      )
      expect(ratio).toBe(200 / 300)
    })

    it('applies prorata split correctly across 3 subposts (10/10/80%)', () => {
      const study = mockStudy([
        mockSource(SubPost.Achats, 100),
        mockSource(SubPost.Electricite, 100),
        mockSource(SubPost.Informatique, 800),
      ])
      const ratioAchats = getActionReductionRatio(
        study,
        false,
        [],
        [SubPost.Achats, SubPost.Electricite, SubPost.Informatique],
        [],
        [],
        [SubPost.Achats],
        [],
      )
      expect(ratioAchats).toBe(100 / 1000)

      const ratioInformatique = getActionReductionRatio(
        study,
        false,
        [],
        [SubPost.Achats, SubPost.Electricite, SubPost.Informatique],
        [],
        [],
        [SubPost.Informatique],
        [],
      )
      expect(ratioInformatique).toBe(800 / 1000)
    })
  })

  describe('getUIFilteredEmissions', () => {
    it('returns 0 when siteIds is empty (user selected nothing)', () => {
      const study = makeStudy([makeSource(SubPost.Achats, 100)])
      expect(getUIFilteredEmissions(study, false, [], [SubPost.Achats], ['other'])).toBe(0)
    })

    it('returns 0 when subPosts is empty (user selected nothing)', () => {
      const study = makeStudy([makeSource(SubPost.Achats, 100)])
      expect(getUIFilteredEmissions(study, false, ['site-a'], [], ['other'])).toBe(0)
    })

    it('returns 0 when tagIds is empty and sources have tags (user selected nothing)', () => {
      const study = makeStudy([makeSource(SubPost.Achats, 100, true, 'site-a', 'study-site-a', ['tag-1'])])
      expect(getUIFilteredEmissions(study, false, ['site-a'], [SubPost.Achats], [])).toBe(0)
    })

    it('returns correct total when all filters match', () => {
      const study = makeStudy([
        makeSource(SubPost.Achats, 100, true, 'site-a', 'study-site-a', ['tag-1']),
        makeSource(SubPost.Electricite, 200, true, 'site-a', 'study-site-a', ['tag-1']),
      ])
      expect(getUIFilteredEmissions(study, false, ['site-a'], [SubPost.Achats, SubPost.Electricite], ['tag-1'])).toBe(
        300,
      )
    })

    it('excludes sources not matching the site filter', () => {
      const study = makeStudy([
        makeSource(SubPost.Achats, 100, true, 'site-a', 'study-site-a'),
        makeSource(SubPost.Achats, 200, true, 'site-b', 'study-site-b'),
      ])
      expect(getUIFilteredEmissions(study, false, ['site-a'], [SubPost.Achats], ['other'])).toBe(100)
    })

    it('excludes sources not matching the subPost filter', () => {
      const study = makeStudy([makeSource(SubPost.Achats, 100), makeSource(SubPost.Electricite, 200)])
      expect(getUIFilteredEmissions(study, false, ['site-a'], [SubPost.Achats], ['other'])).toBe(100)
    })

    it('excludes unvalidated sources when validatedOnly is true', () => {
      const study = makeStudy([makeSource(SubPost.Achats, 100, true), makeSource(SubPost.Achats, 200, false)])
      expect(getUIFilteredEmissions(study, true, ['site-a'], [SubPost.Achats], ['other'])).toBe(100)
    })

    it('includes unvalidated sources when validatedOnly is false', () => {
      const study = makeStudy([makeSource(SubPost.Achats, 100, true), makeSource(SubPost.Achats, 200, false)])
      expect(getUIFilteredEmissions(study, false, ['site-a'], [SubPost.Achats], ['other'])).toBe(300)
    })

    it('includes untagged sources when "other" is in tagIds', () => {
      const study = makeStudy([
        makeSource(SubPost.Achats, 100, true, 'site-a', 'study-site-a', []),
        makeSource(SubPost.Achats, 200, true, 'site-a', 'study-site-a', ['tag-1']),
      ])
      expect(getUIFilteredEmissions(study, false, ['site-a'], [SubPost.Achats], ['other'])).toBe(100)
    })
  })
})
