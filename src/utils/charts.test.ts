import { Post } from '@/services/posts'
import { translationMock } from '@/tests/utils/models/translationsMock'
import { expect } from '@jest/globals'
import { Theme } from '@mui/material'
import { StudyResultUnit, SubPost } from '@prisma/client'
import {
  BasicTypeCharts,
  formatValueAndUnit,
  getChildColor,
  getLabel,
  getParentColor,
  getPostColor,
  getPostLabel,
  processBarChartData,
  processPieChartData,
} from './charts'

// TODO : remove these mocks. Should not be mocked but tests fail if not
jest.mock('../services/file', () => ({ download: jest.fn() }))
jest.mock('../services/auth', () => ({ auth: jest.fn() }))

jest.mock('../services/permissions/study', () => ({ canReadStudy: jest.fn() }))
jest.mock('./study', () => ({
  getAccountRoleOnStudy: jest.fn(),
  STUDY_UNIT_VALUES: { K: 1, T: 1000 },
}))
jest.mock('next-intl/server', () => ({
  getTranslations: jest.fn(() => (key: string) => key),
}))

// Test helpers
const createMockTheme = (customProps: Record<string, unknown> = {}): Theme =>
  ({
    palette: { primary: { light: '#PRIMARY_LIGHT' } },
    custom: {
      postColors: {},
      subPostColors: {},
      tagFamilyColors: ['#TAG_0', '#TAG_1', '#TAG_2'],
      ...customProps,
    },
  }) as unknown as Theme

const createPostData = (overrides: Partial<BasicTypeCharts> = {}): BasicTypeCharts => ({
  value: 1000,
  label: 'Parent',
  post: Post.Alimentation,
  children: [
    { value: 600, label: 'Child 1A' },
    { value: 400, label: 'Child 1B' },
  ],
  ...overrides,
})

const createTagData = (overrides: Partial<BasicTypeCharts> = {}): BasicTypeCharts => ({
  value: 1500,
  label: 'Tag Family',
  children: [
    { value: 900, label: 'Tag 1A', color: '#TAG1A' },
    { value: 600, label: 'Tag 1B', color: '#TAG1B' },
  ],
  ...overrides,
})

describe('charts utils function', () => {
  describe('formatValueAndUnit', () => {
    test('should format value and unit correctly', () => {
      expect(formatValueAndUnit(12.45687884, 'kg')).toBe('12,46 kg')
    })

    test('should format value without unit', () => {
      expect(formatValueAndUnit(12.45687884)).toBe('12,46 ')
    })

    test('should handle null value', () => {
      expect(formatValueAndUnit(null, 'kg')).toBe('0 kg')
    })
  })

  describe('getPostColor', () => {
    test('should return provided color if exists', () => {
      const themeColors = {
        palette: { primary: { light: '#0000FF' } },
        custom: { postColors: { Alimentation: { light: '#00FF00' } } },
      } as unknown as Theme
      expect(getPostColor(themeColors, Post.Alimentation, '#FF0000')).toBe('#FF0000')
    })

    test('should return post color if post exists and color not provided', () => {
      const themeColors = {
        palette: { primary: { light: '#0000FF' } },
        custom: { postColors: { Alimentation: { light: '#00FF00' } } },
      } as unknown as Theme
      expect(getPostColor(themeColors, Post.Alimentation)).toBe('#00FF00')
    })

    test('should return default color if no post and no color', () => {
      const themeColors = {
        palette: { primary: { light: '#0000FF' } },
        custom: { postColors: { Alimentation: { light: '#00FF00' } } },
      } as unknown as Theme
      expect(getPostColor(themeColors)).toBe('#0000FF')
    })

    test('should return default color if post does not exists and no color', () => {
      const themeColors = {
        palette: { primary: { light: '#0000FF' } },
        custom: { postColors: { Alimentation: { light: '#00FF00' } } },
      } as unknown as Theme
      expect(getPostColor(themeColors, Post.Energies)).toBe('#0000FF')
    })

    test('should return default color if post is not a post', () => {
      const themeColors = {
        palette: { primary: { light: '#0000FF' } },
        custom: { postColors: { Alimentation: { light: '#00FF00' } } },
      } as unknown as Theme
      expect(getPostColor(themeColors, 'okok')).toBe('#0000FF')
    })
  })

  describe('getPostLabel', () => {
    test('should return provided label if exists', () => {
      expect(
        getPostLabel('My Label', Post.Alimentation, translationMock({ [Post.Alimentation]: 'Alimentation' })),
      ).toBe('My Label')
    })

    test('should return translated post if no label provided and post exists', () => {
      expect(getPostLabel(undefined, Post.Alimentation, translationMock({ [Post.Alimentation]: 'Alimentation' }))).toBe(
        'Alimentation',
      )
    })

    test('should return empty string if no label and no post', () => {
      expect(getPostLabel(undefined, undefined, translationMock({ [Post.Alimentation]: 'Alimentation' }))).toBe('')
    })

    test('should return empty string if no label and post is not a post', () => {
      expect(getPostLabel(undefined, 'okok', translationMock({ [Post.Alimentation]: 'Alimentation' }))).toBe('')
    })

    test('should return empty string if no label and post exists but no translation function provided', () => {
      expect(getPostLabel(undefined, Post.Alimentation)).toBe('')
    })
  })

  describe('Two-level charts - getParentColor', () => {
    let theme: Theme

    beforeEach(() => {
      theme = createMockTheme({
        postColors: { [Post.Alimentation]: { light: '#POST_COLOR' } },
      })
    })

    test('should return post color for post type', () => {
      const item = { post: Post.Alimentation, color: undefined }
      expect(getParentColor('post', theme, item, 0)).toBe('#POST_COLOR')
    })

    test('should return custom color for post type when provided', () => {
      const item = { post: Post.Alimentation, color: '#CUSTOM' }
      expect(getParentColor('post', theme, item, 0)).toBe('#CUSTOM')
    })

    test('should return tag family color for tag type', () => {
      const item = { post: undefined, color: undefined }
      expect(getParentColor('tag', theme, item, 1)).toBe('#TAG_1')
    })

    test('should return first tag color when index is undefined', () => {
      const item = { post: undefined, color: undefined }
      expect(getParentColor('tag', theme, item)).toBe('#TAG_0')
    })
  })

  describe('Two-level chart - getChildColor', () => {
    let theme: Theme

    beforeEach(() => {
      theme = createMockTheme({
        subPostColors: { [SubPost.CombustiblesFossiles]: '#SUBPOST_COLOR' },
      })
    })

    test('should return subpost color for post type', () => {
      const child = { value: 100, label: 'Test', post: SubPost.CombustiblesFossiles }
      expect(getChildColor('post', theme, child)).toBe('#SUBPOST_COLOR')
    })

    test('should return theme primary light color for post type when subpost not found', () => {
      const child = { value: 100, label: 'Test', post: 'UnknownSubPost' }
      expect(getChildColor('post', theme, child)).toBe('#PRIMARY_LIGHT')
    })

    test('should return custom color for tag type', () => {
      const child = { value: 100, label: 'Test', color: '#TAG_CUSTOM' }
      expect(getChildColor('tag', theme, child)).toBe('#TAG_CUSTOM')
    })

    test('should return default color for tag type when no custom color', () => {
      const child = { value: 100, label: 'Test' }
      expect(getChildColor('tag', theme, child)).toBe('#PRIMARY_LIGHT')
    })
  })

  describe('Two-level chart - getLabel', () => {
    let tPost: ReturnType<typeof translationMock>

    beforeEach(() => {
      tPost = translationMock({ [Post.Alimentation]: 'Food' })
    })

    test('should return item label for tag type', () => {
      const item = { label: 'Tag Label', post: Post.Alimentation }
      expect(getLabel('tag', item, tPost)).toBe('Tag Label')
    })

    test('should return empty string for tag type when no label', () => {
      const item = { post: Post.Alimentation }
      expect(getLabel('tag', item, tPost)).toBe('')
    })

    test('should return translated post for post type', () => {
      const item = { post: Post.Alimentation }
      expect(getLabel('post', item, tPost)).toBe('Food')
    })

    test('should return custom label for post type when provided', () => {
      const item = { label: 'Custom Label', post: Post.Alimentation }
      expect(getLabel('post', item, tPost)).toBe('Custom Label')
    })
  })

  describe('Two-level chart - processPieChartData', () => {
    let mockData: BasicTypeCharts[]
    let theme: Theme

    beforeEach(() => {
      theme = createMockTheme({
        postColors: { [Post.Alimentation]: { light: '#POST_ALIMENTATION' } },
        subPostColors: { [SubPost.CombustiblesFossiles]: '#SUBPOST_FOSSILE' },
      })

      mockData = [
        createPostData({
          value: 2000,
          label: 'Alimentation',
          post: Post.Alimentation,
          children: [
            { value: 1200, label: 'Fossile', post: SubPost.CombustiblesFossiles },
            { value: 800, label: 'Organic' },
          ],
        }),
      ]
    })

    test('should process posts without sublevel', () => {
      const result = processPieChartData(mockData, 'post', false, theme, StudyResultUnit.K)

      expect(result.innerRingData).toHaveLength(1)
      expect(result.outerRingData).toHaveLength(0)

      const parent = result.innerRingData[0]
      expect(parent.label).toBe('Alimentation')
      expect(parent.value).toBe(2000) // 2000 / 1 (K unit)
      expect(parent.color).toBe('#POST_ALIMENTATION')
    })

    test('should process posts with sublevel', () => {
      const result = processPieChartData(mockData, 'post', true, theme, StudyResultUnit.T)

      expect(result.innerRingData).toHaveLength(1)
      expect(result.outerRingData).toHaveLength(2)

      const parent = result.innerRingData[0]
      expect(parent.label).toBe('Alimentation')
      expect(parent.value).toBe(2) // 2000 / 1000 (T unit)
      expect(parent.color).toBe('#POST_ALIMENTATION')

      const children = result.outerRingData
      expect(children[0].label).toBe('Fossile')
      expect(children[0].value).toBe(1.2) // 1200 / 1000
      expect(children[0].color).toBe('#SUBPOST_FOSSILE')

      expect(children[1].label).toBe('Organic')
      expect(children[1].value).toBe(0.8) // 800 / 1000
      expect(children[1].color).toBe('#PRIMARY_LIGHT') // Default color
    })

    test('should process tags without sublevel', () => {
      const tagData = [
        createTagData({
          label: 'Tag Family',
          children: [
            { value: 500, label: 'Tag A', color: '#TAG_A' },
            { value: 300, label: 'Tag B', color: '#TAG_B' },
          ],
        }),
      ]

      const result = processPieChartData(tagData, 'tag', false, theme, StudyResultUnit.K)

      expect(result.innerRingData).toHaveLength(2) // Only children for tags without sublevel
      expect(result.outerRingData).toHaveLength(0)
      expect(result.innerRingData.map((item) => item.label)).toEqual(['Tag A', 'Tag B'])
      expect(result.innerRingData.map((item) => item.color)).toEqual(['#TAG_A', '#TAG_B'])
    })

    test('should process tags with sublevel', () => {
      const tagData = [
        createTagData({
          label: 'Tag Family',
          children: [
            { value: 500, label: 'Tag A', color: '#TAG_A' },
            { value: 300, label: 'Tag B', color: '#TAG_B' },
          ],
        }),
      ]

      const result = processPieChartData(tagData, 'tag', true, theme, StudyResultUnit.K)

      expect(result.innerRingData).toHaveLength(1) // Family
      expect(result.outerRingData).toHaveLength(2) // Children
      expect(result.innerRingData[0].label).toBe('Tag Family')
      expect(result.outerRingData.map((item) => item.label)).toEqual(['Tag A', 'Tag B'])
    })

    test('should process multiple posts without sublevel', () => {
      const multiplePostsData = [
        createPostData({
          value: 2000,
          label: 'Alimentation',
          post: Post.Alimentation,
        }),
        createPostData({
          value: 1500,
          label: 'Transport',
          post: Post.Deplacements,
        }),
      ]

      const result = processPieChartData(multiplePostsData, 'post', false, theme, StudyResultUnit.K)

      expect(result.innerRingData).toHaveLength(2)
      expect(result.outerRingData).toHaveLength(0)
      expect(result.innerRingData.map((item) => item.label)).toEqual(['Alimentation', 'Transport'])
      expect(result.innerRingData.map((item) => item.value)).toEqual([2000, 1500])
    })

    test('should process multiple posts with sublevel', () => {
      const multiplePostsData = [
        createPostData({
          value: 2000,
          label: 'Alimentation',
          post: Post.Alimentation,
          children: [
            { value: 1200, label: 'Fossile', post: SubPost.CombustiblesFossiles },
            { value: 800, label: 'Organic' },
          ],
        }),
        createPostData({
          value: 1500,
          label: 'Transport',
          post: Post.Deplacements,
          children: [
            { value: 900, label: 'Car' },
            { value: 600, label: 'Plane' },
          ],
        }),
      ]

      const result = processPieChartData(multiplePostsData, 'post', true, theme, StudyResultUnit.K)

      expect(result.innerRingData).toHaveLength(2)
      expect(result.outerRingData).toHaveLength(4)
      expect(result.innerRingData.map((item) => item.label)).toEqual(['Alimentation', 'Transport'])
      expect(result.outerRingData.map((item) => item.label)).toEqual(['Fossile', 'Organic', 'Car', 'Plane'])
    })
  })

  describe('Two-level chart - processPieChartData for multiple tag families', () => {
    let mockTagData: BasicTypeCharts[]
    let theme: Theme

    beforeEach(() => {
      theme = createMockTheme({
        tagFamilyColors: ['#FAMILY_0', '#FAMILY_1', '#FAMILY_2'],
      })

      mockTagData = [
        createTagData({
          label: 'Tag Family 1',
          children: [
            { value: 900, label: 'Tag 1A', color: '#TAG_1A' },
            { value: 600, label: 'Tag 1B', color: '#TAG_1B' },
          ],
        }),
        createTagData({
          value: 2500,
          label: 'Tag Family 2',
          children: [
            { value: 1000, label: 'Tag 2A', color: '#TAG_2A' },
            { value: 1500, label: 'Tag 2B', color: '#TAG_2B' },
          ],
        }),
      ]
    })

    test('should process tags without sublevel', () => {
      const result = processPieChartData(mockTagData, 'tag', false, theme, StudyResultUnit.K)

      expect(result.innerRingData).toHaveLength(4)
      expect(result.outerRingData).toHaveLength(0)
      expect(result.innerRingData.map((item) => item.label)).toEqual(['Tag 1A', 'Tag 1B', 'Tag 2A', 'Tag 2B'])
      expect(result.innerRingData.map((item) => item.color)).toEqual(['#TAG_1A', '#TAG_1B', '#TAG_2A', '#TAG_2B'])
    })

    test('should process tags with sublevel', () => {
      const result = processPieChartData(mockTagData, 'tag', true, theme, StudyResultUnit.K)

      expect(result.innerRingData).toHaveLength(2)
      expect(result.outerRingData).toHaveLength(4)
      expect(result.innerRingData.map((item) => item.label)).toEqual(['Tag Family 1', 'Tag Family 2'])
      expect(result.outerRingData.map((item) => item.label)).toEqual(['Tag 1A', 'Tag 1B', 'Tag 2A', 'Tag 2B'])
      expect(result.innerRingData.map((item) => item.color)).toEqual(['#FAMILY_0', '#FAMILY_1'])
    })

    test('should process multiple tag families for bar chart without sublevel', () => {
      const tPost = translationMock({})
      const result = processBarChartData(mockTagData, 'tag', false, theme, StudyResultUnit.K, tPost)

      expect(result.barData.labels).toEqual(['Tag 1A', 'Tag 1B', 'Tag 2A', 'Tag 2B'])
      expect(result.barData.values).toEqual([900, 600, 1000, 1500])
      expect(result.barData.colors).toHaveLength(4)
      expect(result.seriesData).toEqual([])
    })

    test('should process multiple tag families for bar chart with sublevel', () => {
      const tPost = translationMock({})
      const result = processBarChartData(mockTagData, 'tag', true, theme, StudyResultUnit.K, tPost)

      expect(result.barData.labels).toEqual(['Tag Family 1', 'Tag Family 2'])
      expect(result.barData.values).toEqual([])
      expect(result.barData.colors).toEqual([])
      expect(result.seriesData).toHaveLength(4)
      expect(result.seriesData.map((s) => s.label)).toEqual(['Tag 1A', 'Tag 1B', 'Tag 2A', 'Tag 2B'])
      expect(result.seriesData.map((s) => s.data)).toEqual([
        [900, 0],
        [600, 0],
        [0, 1000],
        [0, 1500],
      ])
    })
  })

  describe('Two-level chart - processBarChartData', () => {
    let theme: Theme
    let tPost: ReturnType<typeof translationMock>

    beforeEach(() => {
      theme = createMockTheme({
        postColors: { [Post.Alimentation]: { light: '#POST_ALIMENTATION' } },
        subPostColors: { [SubPost.CombustiblesFossiles]: '#SUBPOST_FOSSILE' },
      })
      tPost = translationMock({ [Post.Alimentation]: 'Food' })
    })

    test('should process posts without sublevel', () => {
      const mockData = [createPostData({ label: 'Parent 1' })]
      const result = processBarChartData(mockData, 'post', false, theme, StudyResultUnit.K, tPost)

      expect(result.barData.labels).toEqual(['Parent 1'])
      expect(result.barData.values).toEqual([1000]) // 1000 / 1 (K unit = 1)
      expect(result.barData.colors).toHaveLength(1)
      expect(result.seriesData).toEqual([])
    })

    test('should process posts with sublevel', () => {
      const mockData = [
        createPostData({
          label: 'Alimentation',
          post: Post.Alimentation,
          children: [
            { value: 600, label: 'Fossile', post: SubPost.CombustiblesFossiles },
            { value: 400, label: 'Organic' },
          ],
        }),
      ]
      const result = processBarChartData(mockData, 'post', true, theme, StudyResultUnit.T, tPost)

      expect(result.barData.labels).toEqual(['Alimentation'])
      expect(result.barData.values).toEqual([])
      expect(result.barData.colors).toEqual([])
      expect(result.seriesData).toHaveLength(2)
      expect(result.seriesData[0].label).toBe('Fossile')
      expect(result.seriesData[0].data).toEqual([0.6]) // 600 / 1000
      expect(result.seriesData[0].color).toBe('#SUBPOST_FOSSILE')
      expect(result.seriesData[1].label).toBe('Organic')
      expect(result.seriesData[1].data).toEqual([0.4]) // 400 / 1000
    })

    test('should process tags without sublevel', () => {
      const mockData = [createTagData({ label: 'Tag Family 1' })]
      const result = processBarChartData(mockData, 'tag', false, theme, StudyResultUnit.K, tPost)

      expect(result.barData.labels).toEqual(['Tag 1A', 'Tag 1B'])
      expect(result.barData.values).toEqual([900, 600]) // Values from createTagData
      expect(result.barData.colors).toHaveLength(2)
      expect(result.seriesData).toEqual([])
    })

    test('should process tags with sublevel', () => {
      const mockData = [
        createTagData({
          label: 'Tag Family 1',
          children: [
            { value: 500, label: 'Tag A', color: '#TAG_A' },
            { value: 300, label: 'Tag B', color: '#TAG_B' },
          ],
        }),
      ]
      const result = processBarChartData(mockData, 'tag', true, theme, StudyResultUnit.K, tPost)

      expect(result.barData.labels).toEqual(['Tag Family 1'])
      expect(result.barData.values).toEqual([])
      expect(result.barData.colors).toEqual([])
      expect(result.seriesData).toHaveLength(2)
      expect(result.seriesData[0].label).toBe('Tag A')
      expect(result.seriesData[0].data).toEqual([500])
      expect(result.seriesData[0].color).toBe('#TAG_A')
    })

    test('should process multiple posts without sublevel', () => {
      const multiplePostsData = [
        createPostData({ label: 'Alimentation', post: Post.Alimentation, value: 2000 }),
        createPostData({ label: 'Transport', post: Post.Deplacements, value: 1500 }),
      ]
      const result = processBarChartData(multiplePostsData, 'post', false, theme, StudyResultUnit.K, tPost)

      expect(result.barData.labels).toEqual(['Alimentation', 'Transport'])
      expect(result.barData.values).toEqual([2000, 1500])
      expect(result.barData.colors).toHaveLength(2)
      expect(result.seriesData).toEqual([])
    })

    test('should process multiple posts with sublevel', () => {
      const multiplePostsData = [
        createPostData({
          label: 'Alimentation',
          post: Post.Alimentation,
          value: 2000,
          children: [
            { value: 1200, label: 'Fossile', post: SubPost.CombustiblesFossiles },
            { value: 800, label: 'Organic' },
          ],
        }),
        createPostData({
          label: 'Transport',
          post: Post.Deplacements,
          value: 1500,
          children: [
            { value: 900, label: 'Car' },
            { value: 600, label: 'Plane' },
          ],
        }),
      ]
      const result = processBarChartData(multiplePostsData, 'post', true, theme, StudyResultUnit.K, tPost)

      expect(result.barData.labels).toEqual(['Alimentation', 'Transport'])
      expect(result.barData.values).toEqual([])
      expect(result.barData.colors).toEqual([])
      expect(result.seriesData).toHaveLength(4)
      expect(result.seriesData.map((s) => s.label)).toEqual(['Fossile', 'Organic', 'Car', 'Plane'])
      expect(result.seriesData.map((s) => s.data)).toEqual([
        [1200, 0],
        [800, 0],
        [0, 900],
        [0, 600],
      ])
    })

    test('should process multiple tags without sublevel', () => {
      const multipleTagsData = [
        createTagData({
          label: 'Tag Family 1',
          children: [
            { value: 500, label: 'Tag 1A', color: '#TAG_1A' },
            { value: 300, label: 'Tag 1B', color: '#TAG_1B' },
          ],
        }),
        createTagData({
          label: 'Tag Family 2',
          value: 2000,
          children: [
            { value: 800, label: 'Tag 2A', color: '#TAG_2A' },
            { value: 1200, label: 'Tag 2B', color: '#TAG_2B' },
          ],
        }),
      ]
      const result = processBarChartData(multipleTagsData, 'tag', false, theme, StudyResultUnit.K, tPost)

      expect(result.barData.labels).toEqual(['Tag 1A', 'Tag 1B', 'Tag 2A', 'Tag 2B'])
      expect(result.barData.values).toEqual([500, 300, 800, 1200])
      expect(result.barData.colors).toHaveLength(4)
      expect(result.seriesData).toEqual([])
    })

    test('should process multiple tags with sublevel', () => {
      const multipleTagsData = [
        createTagData({
          label: 'Tag Family 1',
          children: [
            { value: 500, label: 'Tag 1A', color: '#TAG_1A' },
            { value: 300, label: 'Tag 1B', color: '#TAG_1B' },
          ],
        }),
        createTagData({
          label: 'Tag Family 2',
          value: 2000,
          children: [
            { value: 800, label: 'Tag 2A', color: '#TAG_2A' },
            { value: 1200, label: 'Tag 2B', color: '#TAG_2B' },
          ],
        }),
      ]
      const result = processBarChartData(multipleTagsData, 'tag', true, theme, StudyResultUnit.K, tPost)

      expect(result.barData.labels).toEqual(['Tag Family 1', 'Tag Family 2'])
      expect(result.barData.values).toEqual([])
      expect(result.barData.colors).toEqual([])
      expect(result.seriesData).toHaveLength(4)
      expect(result.seriesData.map((s) => s.label)).toEqual(['Tag 1A', 'Tag 1B', 'Tag 2A', 'Tag 2B'])
      expect(result.seriesData.map((s) => s.data)).toEqual([
        [500, 0],
        [300, 0],
        [0, 800],
        [0, 1200],
      ])
    })
  })
})
