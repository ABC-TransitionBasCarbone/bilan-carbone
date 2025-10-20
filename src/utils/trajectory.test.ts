import { expect } from '@jest/globals'
import { calculateSBTiTrajectory, SBTI_REDUCTION_RATE_15, SBTI_REDUCTION_RATE_WB2C } from './trajectory'

const DEFAULT_LINEAR_REDUCTION_15C = 42
const DEFAULT_LINEAR_REDUCTION_WB2C = 25
const COMENSATED_LINEAR_REDUCTION_2025_15C = 46.125
const COMENSATED_LINEAR_REDUCTION_2025_WB2C = 26.316

describe('calculateTrajectory', () => {
  describe('basic trajectory calculation before 2021', () => {
    test('should calculate trajectory from 2020 to 2050 with 1.5°C trajectory', () => {
      const result = calculateSBTiTrajectory({
        baseEmissions: 1000,
        studyStartYear: 2020,
        reductionRate: SBTI_REDUCTION_RATE_15,
      })

      expect(result).toHaveLength(31)
      expect(result[0]).toEqual({ year: 2020, value: 1000 })

      const result2043 = result.find((p) => p.year === 2043)
      expect(result2043?.value).toBeCloseTo(Math.max(0, 1000 - (2043 - 2020) * DEFAULT_LINEAR_REDUCTION_15C), 1)

      const result2044 = result.find((p) => p.year === 2044)
      expect(result2044?.value).toBeCloseTo(0, 1)
    })

    test('should calculate trajectory with 2°C trajectory', () => {
      const result = calculateSBTiTrajectory({
        baseEmissions: 1000,
        studyStartYear: 2020,
        reductionRate: SBTI_REDUCTION_RATE_WB2C,
      })

      expect(result).toHaveLength(2061 - 2020)
      expect(result[0]).toEqual({ year: 2020, value: 1000 })
      expect(result[30].year).toBe(2050)
      expect(result[30].value).toBeCloseTo(Math.max(0, 1000 - (2050 - 2020) * DEFAULT_LINEAR_REDUCTION_WB2C), 1)

      const result2060 = result.find((p) => p.year === 2060)
      expect(result2060?.value).toBeCloseTo(Math.max(0, 1000 - (2060 - 2020) * DEFAULT_LINEAR_REDUCTION_WB2C), 1)
    })

    test('should start graph from study year and keep emissions flat until 2020', () => {
      const result = calculateSBTiTrajectory({
        baseEmissions: 1000,
        studyStartYear: 2018,
        reductionRate: SBTI_REDUCTION_RATE_15,
      })

      expect(result[0]).toEqual({ year: 2018, value: 1000 })
      expect(result[1]).toEqual({ year: 2019, value: 1000 })
      expect(result[2]).toEqual({ year: 2020, value: 1000 })
      expect(result[3].year).toBe(2021)
      expect(Math.round(result[3].value)).toBe(958)
    })
  })

  describe('trajectory calculation after 2020 with overshoot compensation', () => {
    test('should calculate exact values for 2025 start with 1.5°C trajectory', () => {
      const baseEmissions = 1000
      const studyStartYear = 2025
      const reductionRate = SBTI_REDUCTION_RATE_15

      const result = calculateSBTiTrajectory({
        baseEmissions,
        studyStartYear,
        reductionRate,
      })

      expect(result[0]).toEqual({ year: 2020, value: 1000 })
      expect(result[5]).toEqual({ year: 2025, value: 1000 })

      expect(result[6].year).toBe(2026)
      expect(result[6].value).toBeCloseTo(1000 - (2026 - 2025) * COMENSATED_LINEAR_REDUCTION_2025_15C, 1)
      expect(result[7].year).toBe(2027)
      expect(result[7].value).toBeCloseTo(1000 - (2027 - 2025) * COMENSATED_LINEAR_REDUCTION_2025_15C, 1)

      const point2046 = result.find((p) => p.year === 2046)
      expect(point2046?.value).toBeCloseTo(1000 - (2046 - 2025) * COMENSATED_LINEAR_REDUCTION_2025_15C, 1)

      const lastPoint = result[result.length - 1]
      expect(lastPoint.year).toBe(2050)
      expect(lastPoint.value).toBeCloseTo(0, 1)
    })

    test('should calculate exact values for 2025 start with WB2C trajectory', () => {
      const baseEmissions = 1000
      const studyStartYear = 2025
      const reductionRate = SBTI_REDUCTION_RATE_WB2C

      const result = calculateSBTiTrajectory({
        baseEmissions,
        studyStartYear,
        reductionRate,
      })

      expect(result[0]).toEqual({ year: 2020, value: 1000 })
      expect(result[5]).toEqual({ year: 2025, value: 1000 })

      expect(result[6].year).toBe(2026)
      expect(result[6].value).toBeCloseTo(1000 - (2026 - 2025) * COMENSATED_LINEAR_REDUCTION_2025_WB2C, 1)

      expect(result[7].year).toBe(2027)
      expect(result[7].value).toBeCloseTo(1000 - (2027 - 2025) * COMENSATED_LINEAR_REDUCTION_2025_WB2C, 1)

      const point2050 = result.find((p) => p.year === 2050)
      expect(point2050?.value).toBeCloseTo(1000 - (2050 - 2025) * COMENSATED_LINEAR_REDUCTION_2025_WB2C, 1)

      const lastPoint = result[result.length - 1]
      expect(lastPoint.year).toBe(2063)
      expect(lastPoint.value).toBeCloseTo(0, 1)
    })
  })
})
