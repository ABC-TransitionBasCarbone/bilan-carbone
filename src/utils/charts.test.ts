import { expect } from '@jest/globals'
import { formatValueAndUnit } from './charts'

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
})
