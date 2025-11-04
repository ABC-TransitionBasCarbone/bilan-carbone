import { TrajectoryDataPoint } from '@/components/study/transitionPlan/TrajectoryGraph'
import { expect } from '@jest/globals'
import { Action, TrajectoryType } from '@prisma/client'
import {
  calculateActionBasedTrajectory,
  calculateCustomTrajectory,
  calculateSBTiTrajectory,
  getReductionRatePerType,
  SBTI_REDUCTION_RATE_15,
  SBTI_REDUCTION_RATE_WB2C,
} from './trajectory'

// TODO: ESM module issue with Jest. Remove these mocks when moving to Vitest
jest.mock('../services/file', () => ({ download: jest.fn() }))
jest.mock('../services/auth', () => ({ auth: jest.fn() }))
jest.mock('uuid', () => ({ v4: jest.fn() }))
jest.mock('next-intl/server', () => ({ getTranslations: jest.fn(() => (key: string) => key) }))

const DEFAULT_LINEAR_REDUCTION_15C = 42
const DEFAULT_LINEAR_REDUCTION_WB2C = 25
const COMENSATED_LINEAR_REDUCTION_2025_15C = 46.125
const COMENSATED_LINEAR_REDUCTION_2025_WB2C = 26.316

describe('calculateTrajectory', () => {
  describe('basic trajectory calculation before 2021', () => {
    test('should calculate trajectory from 2020 to 2050 with 1.5°C trajectory', () => {
      const result = calculateSBTiTrajectory({
        studyEmissions: 1000,
        studyStartYear: 2020,
        reductionRate: SBTI_REDUCTION_RATE_15,
        withDependencies: true,
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
        studyEmissions: 1000,
        studyStartYear: 2020,
        reductionRate: SBTI_REDUCTION_RATE_WB2C,
        withDependencies: true,
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
        studyEmissions: 1000,
        studyStartYear: 2018,
        reductionRate: SBTI_REDUCTION_RATE_15,
        withDependencies: true,
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
      const studyEmissions = 1000
      const studyStartYear = 2025
      const reductionRate = SBTI_REDUCTION_RATE_15

      const result = calculateSBTiTrajectory({
        studyEmissions,
        studyStartYear,
        reductionRate,
        withDependencies: true,
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
      const studyEmissions = 1000
      const studyStartYear = 2025
      const reductionRate = SBTI_REDUCTION_RATE_WB2C

      const result = calculateSBTiTrajectory({
        studyEmissions,
        studyStartYear,
        reductionRate,
        withDependencies: true,
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
      const studyEmissions = 1000
      const studyStartYear = 2024
      const objectives = [{ targetYear: 2030, reductionRate: 0.05 }]

      const result = calculateCustomTrajectory({
        studyEmissions,
        studyStartYear,
        objectives,
        withDependencies: true,
      })

      expect(result[0]).toEqual({ year: 2020, value: 1000 })
      const startPoint = result.find((p) => p.year === studyStartYear)
      expect(startPoint).toEqual({ year: 2024, value: 1000 })

      const yearlyReduction = studyEmissions * 0.05
      const point2025 = result.find((p) => p.year === 2025)
      expect(point2025?.value).toBeCloseTo(1000 - yearlyReduction, 1)

      const point2030 = result.find((p) => p.year === 2030)
      expect(point2030?.value).toBeCloseTo(1000 - (2030 - 2024) * yearlyReduction, 1)

      const lastPoint = result[result.length - 1]
      expect(lastPoint.value).toBe(0)
    })

    test('should calculate trajectory with multiple objectives', () => {
      const studyEmissions = 1000
      const studyStartYear = 2024
      const objectives = [
        { targetYear: 2030, reductionRate: 0.05 },
        { targetYear: 2040, reductionRate: 0.08 },
      ]

      const result = calculateCustomTrajectory({
        studyEmissions,
        studyStartYear,
        objectives,
        withDependencies: true,
      })

      const yearlyReduction = studyEmissions * 0.05

      const point2030 = result.find((p) => p.year === 2030) as TrajectoryDataPoint
      expect(point2030?.value).toBeCloseTo(1000 - (2030 - 2024) * yearlyReduction, 1)

      const newstudyEmissions = point2030.value
      const newYearlyReduction = newstudyEmissions * 0.08

      const point2031 = result.find((p) => p.year === 2031)
      expect(point2031?.value).toBeCloseTo(newstudyEmissions - newYearlyReduction, 1)

      const point2040 = result.find((p) => p.year === 2040)
      expect(point2040?.value).toBeCloseTo(newstudyEmissions - (2040 - 2030) * newYearlyReduction, 1)

      // After last objective we follow the same reduction rate and base emissions until 0
      const point2041 = result.find((p) => p.year === 2041)
      expect(point2041?.value).toBeCloseTo(newstudyEmissions - (2041 - 2030) * newYearlyReduction, 1)
    })

    test('should handle objectives with unsorted years', () => {
      const studyEmissions = 1000
      const studyStartYear = 2024
      const objectives = [
        { targetYear: 2040, reductionRate: 0.08 },
        { targetYear: 2030, reductionRate: 0.05 },
      ]

      const result = calculateCustomTrajectory({
        studyEmissions,
        studyStartYear,
        objectives,
        withDependencies: true,
      })

      const yearlyReduction = studyEmissions * 0.05

      const point2030 = result.find((p) => p.year === 2030) as TrajectoryDataPoint
      expect(point2030?.value).toBeCloseTo(1000 - (2030 - 2024) * yearlyReduction, 1)

      const newstudyEmissions = point2030.value
      const newYearlyReduction = newstudyEmissions * 0.08

      const point2040 = result.find((p) => p.year === 2040)
      expect(point2040?.value).toBeCloseTo(newstudyEmissions - (2040 - 2030) * newYearlyReduction, 1)
    })

    test('should continue reducing until zero emissions after last objective', () => {
      const studyEmissions = 1000
      const studyStartYear = 2024
      const objectives = [{ targetYear: 2030, reductionRate: 0.1 }]

      const result = calculateCustomTrajectory({
        studyEmissions,
        studyStartYear,
        objectives,
        withDependencies: true,
      })

      const lastPoint = result[result.length - 1]
      expect(lastPoint.value).toBe(0)

      expect(lastPoint.year).toBe(2034)
    })

    test('should include flat emissions from reference year to study start year', () => {
      const studyEmissions = 1000
      const studyStartYear = 2024
      const objectives = [{ targetYear: 2030, reductionRate: 0.05 }]

      const result = calculateCustomTrajectory({
        studyEmissions,
        studyStartYear,
        objectives,
        withDependencies: true,
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

  describe('calculateActionBasedTrajectory', () => {
    test('should return base emissions with flat line to 2050 when no quantitative actions', () => {
      const actions = [
        {
          reductionValue: null,
          reductionStartYear: '2025-01-01',
          reductionEndYear: '2030-01-01',
          potentialDeduction: 'Quality',
        },
      ] as Action[]

      const result = calculateActionBasedTrajectory({
        studyEmissions: 1000,
        studyStartYear: 2024,
        actions,
      })

      expect(result[0]).toEqual({ year: 2020, value: 1000 })
      expect(result.find((p) => p.year === 2024)).toEqual({ year: 2024, value: 1000 })
      expect(result.find((p) => p.year === 2050)).toEqual({ year: 2050, value: 1000 })
    })

    test('should calculate trajectory with single quantitative action', () => {
      const actions = [
        {
          reductionValue: 100,
          reductionStartYear: '2025-01-01',
          reductionEndYear: '2030-01-01',
          potentialDeduction: 'Quantity',
        },
      ] as Action[]

      const result = calculateActionBasedTrajectory({
        studyEmissions: 1000,
        studyStartYear: 2024,
        actions,
      })

      const annualReduction = 100 / (2030 - 2025)

      expect(result.find((p) => p.year === 2024)).toEqual({ year: 2024, value: 1000 })
      expect(result.find((p) => p.year === 2025)?.value).toBeCloseTo(1000 - annualReduction, 1)
      expect(result.find((p) => p.year === 2026)?.value).toBeCloseTo(1000 - 2 * annualReduction, 1)
      expect(result.find((p) => p.year === 2027)?.value).toBeCloseTo(1000 - 3 * annualReduction, 1)
      expect(result.find((p) => p.year === 2030)?.value).toBeCloseTo(1000 - 6 * annualReduction, 1)
    })

    test('should calculate trajectory with multiple overlapping actions', () => {
      const actions = [
        {
          reductionValue: 100,
          reductionStartYear: '2025-01-01',
          reductionEndYear: '2030-01-01',
          potentialDeduction: 'Quantity',
        },
        {
          reductionValue: 50,
          reductionStartYear: '2027-01-01',
          reductionEndYear: '2032-01-01',
          potentialDeduction: 'Quantity',
        },
      ] as Action[]

      const result = calculateActionBasedTrajectory({
        studyEmissions: 1000,
        studyStartYear: 2024,
        actions,
      })

      const action1AnnualReduction = 100 / (2030 - 2025)
      const action2AnnualReduction = 50 / (2032 - 2027)

      expect(result.find((p) => p.year === 2024)).toEqual({ year: 2024, value: 1000 })
      expect(result.find((p) => p.year === 2025)?.value).toBeCloseTo(1000 - action1AnnualReduction, 1)
      expect(result.find((p) => p.year === 2026)?.value).toBeCloseTo(1000 - 2 * action1AnnualReduction, 1)
      expect(result.find((p) => p.year === 2027)?.value).toBeCloseTo(
        1000 - 3 * action1AnnualReduction - action2AnnualReduction,
        1,
      )
      expect(result.find((p) => p.year === 2028)?.value).toBeCloseTo(
        1000 - 4 * action1AnnualReduction - 2 * action2AnnualReduction,
        1,
      )

      const lastPoint = result[result.length - 1]
      expect(lastPoint.year).toBe(2050)
    })

    test('should filter out actions with missing data or quality actions', () => {
      const actions = [
        {
          reductionValue: 100,
          reductionStartYear: '2025-01-01',
          reductionEndYear: '2030-01-01',
          potentialDeduction: 'Quality',
        },
        {
          reductionValue: null,
          reductionStartYear: '2025-01-01',
          reductionEndYear: '2030-01-01',
          potentialDeduction: 'Quantity',
        },
        {
          reductionValue: 50,
          reductionStartYear: '2026-01-01',
          reductionEndYear: '2030-01-01',
          potentialDeduction: 'Quantity',
        },
      ] as Action[]

      const result = calculateActionBasedTrajectory({
        studyEmissions: 1000,
        studyStartYear: 2024,
        actions,
      })

      const annualReduction = 50 / (2030 - 2026)
      const point2026 = result.find((p) => p.year === 2026)
      expect(point2026?.value).toBeCloseTo(1000 - annualReduction, 1)

      const point2027 = result.find((p) => p.year === 2027)
      expect(point2027?.value).toBeCloseTo(1000 - 2 * annualReduction, 1)
    })

    test('should correctly sum single-year action with multi-year action in the same year', () => {
      const actions = [
        {
          reductionValue: 100,
          reductionStartYear: '2026-01-01',
          reductionEndYear: '2026-01-01',
          potentialDeduction: 'Quantity',
        },
        {
          reductionValue: 50,
          reductionStartYear: '2025-01-01',
          reductionEndYear: '2030-01-01',
          potentialDeduction: 'Quantity',
        },
      ] as Action[]

      const result = calculateActionBasedTrajectory({
        studyEmissions: 1000,
        studyStartYear: 2024,
        actions,
      })

      const action2AnnualReduction = 50 / (2030 - 2025)

      const expectedResult2026 = 1000 - 2 * action2AnnualReduction - 100

      expect(result.find((p) => p.year === 2024)).toEqual({ year: 2024, value: 1000 })
      expect(result.find((p) => p.year === 2025)?.value).toBeCloseTo(1000 - action2AnnualReduction, 1)
      expect(result.find((p) => p.year === 2026)?.value).toBeCloseTo(expectedResult2026, 1)
      expect(result.find((p) => p.year === 2027)?.value).toBeCloseTo(expectedResult2026 - action2AnnualReduction, 1)
    })

    test('should filter out dependenciesOnly actions when withDependencies is false', () => {
      const actions = [
        {
          reductionValue: 100,
          reductionStartYear: '2025-01-01',
          reductionEndYear: '2030-01-01',
          potentialDeduction: 'Quantity',
          dependenciesOnly: false,
          enabled: true,
        },
        {
          reductionValue: 50,
          reductionStartYear: '2025-01-01',
          reductionEndYear: '2030-01-01',
          potentialDeduction: 'Quantity',
          dependenciesOnly: true,
          enabled: true,
        },
      ] as Action[]

      const resultWithDeps = calculateActionBasedTrajectory({
        studyEmissions: 1000,
        studyStartYear: 2024,
        actions,
        withDependencies: true,
      })

      const resultWithoutDeps = calculateActionBasedTrajectory({
        studyEmissions: 1000,
        studyStartYear: 2024,
        actions,
        withDependencies: false,
      })

      const action1AnnualReduction = 100 / (2030 - 2025)
      const action2AnnualReduction = 50 / (2030 - 2025)

      expect(resultWithDeps.find((p) => p.year === 2025)?.value).toBeCloseTo(
        1000 - action1AnnualReduction - action2AnnualReduction,
        1,
      )

      expect(resultWithoutDeps.find((p) => p.year === 2025)?.value).toBeCloseTo(1000 - action1AnnualReduction, 1)
    })

    test('should include dependenciesOnly actions when withDependencies is true', () => {
      const actions = [
        {
          reductionValue: 100,
          reductionStartYear: '2025-01-01',
          reductionEndYear: '2030-01-01',
          potentialDeduction: 'Quantity',
          dependenciesOnly: true,
          enabled: true,
        },
      ] as Action[]

      const result = calculateActionBasedTrajectory({
        studyEmissions: 1000,
        studyStartYear: 2024,
        actions,
        withDependencies: true,
      })

      const annualReduction = 100 / (2030 - 2025)

      expect(result.find((p) => p.year === 2025)?.value).toBeCloseTo(1000 - annualReduction, 1)
      expect(result.find((p) => p.year === 2030)?.value).toBeCloseTo(1000 - 6 * annualReduction, 1)
    })

    test('should handle mix of dependenciesOnly and regular actions correctly', () => {
      const actions = [
        {
          reductionValue: 100,
          reductionStartYear: '2025-01-01',
          reductionEndYear: '2029-01-01',
          potentialDeduction: 'Quantity',
          dependenciesOnly: false,
          enabled: true,
        },
        {
          reductionValue: 60,
          reductionStartYear: '2026-01-01',
          reductionEndYear: '2030-01-01',
          potentialDeduction: 'Quantity',
          dependenciesOnly: true,
          enabled: true,
        },
        {
          reductionValue: 40,
          reductionStartYear: '2027-01-01',
          reductionEndYear: '2031-01-01',
          potentialDeduction: 'Quantity',
          dependenciesOnly: false,
          enabled: true,
        },
      ] as Action[]

      const resultWithDeps = calculateActionBasedTrajectory({
        studyEmissions: 1000,
        studyStartYear: 2024,
        actions,
        withDependencies: true,
      })

      const resultWithoutDeps = calculateActionBasedTrajectory({
        studyEmissions: 1000,
        studyStartYear: 2024,
        actions,
        withDependencies: false,
      })

      const action1AnnualReduction = 100 / (2029 - 2025)
      const action2AnnualReduction = 60 / (2030 - 2026)
      const action3AnnualReduction = 40 / (2031 - 2027)

      expect(resultWithDeps.find((p) => p.year === 2027)?.value).toBeCloseTo(
        1000 - 3 * action1AnnualReduction - 2 * action2AnnualReduction - action3AnnualReduction,
        1,
      )

      expect(resultWithoutDeps.find((p) => p.year === 2027)?.value).toBeCloseTo(
        1000 - 3 * action1AnnualReduction - action3AnnualReduction,
        1,
      )
    })
  })
})
