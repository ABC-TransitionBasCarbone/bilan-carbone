import { TrajectoryDataPoint } from '@/components/study/transitionPlan/TrajectoryGraph'
import { expect } from '@jest/globals'
import { TrajectoryType } from '@prisma/client'
import {
  calculateCustomTrajectory,
  calculateSBTiTrajectory,
  getReductionRatePerType,
  SBTI_REDUCTION_RATE_15,
  SBTI_REDUCTION_RATE_WB2C,
} from './trajectory'

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

  describe('custom trajectory calculation', () => {
    test('should calculate trajectory with single objective', () => {
      const baseEmissions = 1000
      const studyStartYear = 2024
      const objectives = [{ targetYear: 2030, reductionRate: 0.05 }]

      const result = calculateCustomTrajectory({
        baseEmissions,
        studyStartYear,
        objectives,
      })

      expect(result[0]).toEqual({ year: 2020, value: 1000 })
      const startPoint = result.find((p) => p.year === studyStartYear)
      expect(startPoint).toEqual({ year: 2024, value: 1000 })

      const yearlyReduction = baseEmissions * 0.05
      const point2025 = result.find((p) => p.year === 2025)
      expect(point2025?.value).toBeCloseTo(1000 - yearlyReduction, 1)

      const point2030 = result.find((p) => p.year === 2030)
      expect(point2030?.value).toBeCloseTo(1000 - (2030 - 2024) * yearlyReduction, 1)

      const lastPoint = result[result.length - 1]
      expect(lastPoint.value).toBe(0)
    })

    test('should calculate trajectory with multiple objectives', () => {
      const baseEmissions = 1000
      const studyStartYear = 2024
      const objectives = [
        { targetYear: 2030, reductionRate: 0.05 },
        { targetYear: 2040, reductionRate: 0.08 },
      ]

      const result = calculateCustomTrajectory({
        baseEmissions,
        studyStartYear,
        objectives,
      })

      const yearlyReduction = baseEmissions * 0.05

      const point2030 = result.find((p) => p.year === 2030) as TrajectoryDataPoint
      expect(point2030?.value).toBeCloseTo(1000 - (2030 - 2024) * yearlyReduction, 1)

      const newBaseEmissions = point2030.value
      const newYearlyReduction = newBaseEmissions * 0.08

      const point2031 = result.find((p) => p.year === 2031)
      expect(point2031?.value).toBeCloseTo(newBaseEmissions - newYearlyReduction, 1)

      const point2040 = result.find((p) => p.year === 2040)
      expect(point2040?.value).toBeCloseTo(newBaseEmissions - (2040 - 2030) * newYearlyReduction, 1)

      // After last objective we follow the same reduction rate and base emissions until 0
      const point2041 = result.find((p) => p.year === 2041)
      expect(point2041?.value).toBeCloseTo(newBaseEmissions - (2041 - 2030) * newYearlyReduction, 1)
    })

    test('should handle objectives with unsorted years', () => {
      const baseEmissions = 1000
      const studyStartYear = 2024
      const objectives = [
        { targetYear: 2040, reductionRate: 0.08 },
        { targetYear: 2030, reductionRate: 0.05 },
      ]

      const result = calculateCustomTrajectory({
        baseEmissions,
        studyStartYear,
        objectives,
      })

      const yearlyReduction = baseEmissions * 0.05

      const point2030 = result.find((p) => p.year === 2030) as TrajectoryDataPoint
      expect(point2030?.value).toBeCloseTo(1000 - (2030 - 2024) * yearlyReduction, 1)

      const newBaseEmissions = point2030.value
      const newYearlyReduction = newBaseEmissions * 0.08

      const point2040 = result.find((p) => p.year === 2040)
      expect(point2040?.value).toBeCloseTo(newBaseEmissions - (2040 - 2030) * newYearlyReduction, 1)
    })

    test('should continue reducing until zero emissions after last objective', () => {
      const baseEmissions = 1000
      const studyStartYear = 2024
      const objectives = [{ targetYear: 2030, reductionRate: 0.1 }]

      const result = calculateCustomTrajectory({
        baseEmissions,
        studyStartYear,
        objectives,
      })

      const lastPoint = result[result.length - 1]
      expect(lastPoint.value).toBe(0)

      expect(lastPoint.year).toBe(2034)
    })

    test('should include flat emissions from reference year to study start year', () => {
      const baseEmissions = 1000
      const studyStartYear = 2024
      const objectives = [{ targetYear: 2030, reductionRate: 0.05 }]

      const result = calculateCustomTrajectory({
        baseEmissions,
        studyStartYear,
        objectives,
      })

      const point2020 = result.find((p) => p.year === 2020)
      const point2021 = result.find((p) => p.year === 2021)
      const point2022 = result.find((p) => p.year === 2022)
      const point2023 = result.find((p) => p.year === 2023)

      expect(point2020?.value).toBe(1000)
      expect(point2021?.value).toBe(1000)
      expect(point2022?.value).toBe(1000)
      expect(point2023?.value).toBe(1000)
    })
  })

  describe('getReductionRatePerType', () => {
    test('should return correct reduction rate for SBTI_15', () => {
      const rate = getReductionRatePerType(TrajectoryType.SBTI_15)
      expect(rate).toBe(SBTI_REDUCTION_RATE_15)
    })

    test('should return correct reduction rate for SBTI_WB2C', () => {
      const rate = getReductionRatePerType(TrajectoryType.SBTI_WB2C)
      expect(rate).toBe(SBTI_REDUCTION_RATE_WB2C)
    })

    test('should return undefined for CUSTOM type', () => {
      const rate = getReductionRatePerType(TrajectoryType.CUSTOM)
      expect(rate).toBeUndefined()
    })
  })
})
