import { Post } from '@/services/posts'
import { translationMock } from '@/tests/utils/models/translationsMock'
import { expect } from '@jest/globals'
import { Theme } from '@mui/material'
import { formatValueAndUnit, getColor, getLabel } from './charts'

// TODO : remove these mocks. Should not be mocked but tests fail if not
jest.mock('../services/file', () => ({ download: jest.fn() }))
jest.mock('../services/auth', () => ({ auth: jest.fn() }))

jest.mock('../services/permissions/study', () => ({ canReadStudy: jest.fn() }))
jest.mock('./study', () => ({ getAccountRoleOnStudy: jest.fn() }))
jest.mock('next-intl/server', () => ({
  getTranslations: jest.fn(() => (key: string) => key),
}))

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

  describe('getColor', () => {
    test('should return provided color if exists', () => {
      const themeColors = {
        palette: { primary: { light: '#0000FF' } },
        custom: { postColors: { Alimentation: { light: '#00FF00' } } },
      } as unknown as Theme
      expect(getColor(themeColors, Post.Alimentation, '#FF0000')).toBe('#FF0000')
    })

    test('should return post color if post exists and color not provided', () => {
      const themeColors = {
        palette: { primary: { light: '#0000FF' } },
        custom: { postColors: { Alimentation: { light: '#00FF00' } } },
      } as unknown as Theme
      expect(getColor(themeColors, Post.Alimentation)).toBe('#00FF00')
    })

    test('should return default color if no post and no color', () => {
      const themeColors = {
        palette: { primary: { light: '#0000FF' } },
        custom: { postColors: { Alimentation: { light: '#00FF00' } } },
      } as unknown as Theme
      expect(getColor(themeColors)).toBe('#0000FF')
    })

    test('should return default color if post does not exists and no color', () => {
      const themeColors = {
        palette: { primary: { light: '#0000FF' } },
        custom: { postColors: { Alimentation: { light: '#00FF00' } } },
      } as unknown as Theme
      expect(getColor(themeColors, Post.Energies)).toBe('#0000FF')
    })

    test('should return default color if post is not a post', () => {
      const themeColors = {
        palette: { primary: { light: '#0000FF' } },
        custom: { postColors: { Alimentation: { light: '#00FF00' } } },
      } as unknown as Theme
      expect(getColor(themeColors, 'okok')).toBe('#0000FF')
    })
  })

  describe('getLabel', () => {
    test('should return provided label if exists', () => {
      expect(getLabel('My Label', Post.Alimentation, translationMock({ [Post.Alimentation]: 'Alimentation' }))).toBe(
        'My Label',
      )
    })

    test('should return translated post if no label provided and post exists', () => {
      expect(getLabel(undefined, Post.Alimentation, translationMock({ [Post.Alimentation]: 'Alimentation' }))).toBe(
        'Alimentation',
      )
    })

    test('should return empty string if no label and no post', () => {
      expect(getLabel(undefined, undefined, translationMock({ [Post.Alimentation]: 'Alimentation' }))).toBe('')
    })

    test('should return empty string if no label and post is not a post', () => {
      expect(getLabel(undefined, 'okok', translationMock({ [Post.Alimentation]: 'Alimentation' }))).toBe('')
    })

    test('should return empty string if no label and post exists but no translation function provided', () => {
      expect(getLabel(undefined, Post.Alimentation)).toBe('')
    })
  })
})
