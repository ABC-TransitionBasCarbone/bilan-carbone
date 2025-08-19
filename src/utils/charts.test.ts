import { expect } from '@jest/globals'
import { formatValueAndUnit } from './charts'

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
