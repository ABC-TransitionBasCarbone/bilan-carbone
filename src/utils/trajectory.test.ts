import { TrajectoryDataPoint } from '@/components/study/transitionPlan/TrajectoryGraph'
import { expect } from '@jest/globals'
import { Action, TrajectoryType } from '@prisma/client'
import {
  calculateActionBasedTrajectory,
  calculateCustomTrajectory,
  calculateSBTiTrajectory,
  calculateTrajectoryIntegral,
  getReductionRatePerType,
  getTrajectoryEmissionsAtYear,
  isWithinThreshold,
  PastStudy,
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
// Updated values after fixing overshoot calculation for SBTi (now calculates overshoot even without historical data)
const COMPENSATED_LINEAR_REDUCTION_2025_15C = 7.241379310344829
const COMPENSATED_LINEAR_REDUCTION_2025_WB2C = 3.333333333333333
const EMISSION_FACTOR_VALUE = 10

const createPastStudy = (year: number, totalCo2: number, overrides?: Partial<PastStudy>): PastStudy => ({
  id: `past-study-${year}`,
  name: `Study ${year}`,
  type: 'linked',
  year,
  totalCo2,
  ...overrides,
})

const createPastStudies = (...studies: Array<[number, number]>): PastStudy[] =>
  studies.map(([year, totalCo2]) => createPastStudy(year, totalCo2))

const verifyTrajectoryInterpolation = (
  trajectory: TrajectoryDataPoint[],
  pastStudies: PastStudy[],
  studyStartYear: number,
): void => {
  pastStudies.forEach((pastStudy) => {
    const point = trajectory.find((p) => p.year === pastStudy.year)
    expect(point).toBeDefined()
    expect(point?.value).toBeCloseTo(pastStudy.totalCo2, 1)
  })

  if (pastStudies.length >= 2) {
    for (let i = 0; i < pastStudies.length - 1; i++) {
      const current = pastStudies[i]
      const next = pastStudies[i + 1]
      const midYear = Math.floor((current.year + next.year) / 2)

      if (midYear > current.year && midYear < next.year && midYear < studyStartYear) {
        const midPoint = trajectory.find((p) => p.year === midYear)
        if (midPoint) {
          const expectedValue =
            current.totalCo2 +
            ((midYear - current.year) / (next.year - current.year)) * (next.totalCo2 - current.totalCo2)
          expect(midPoint.value).toBeCloseTo(expectedValue, 1)
        }
      }
    }
  }
}

describe('calculateTrajectory', () => {
  describe('basic trajectory calculation before 2021', () => {
    test('should calculate trajectory from 2020 to 2050 with 1.5°C trajectory', () => {
      const result = calculateSBTiTrajectory({
        studyEmissions: 1000,
        studyStartYear: 2020,
        reductionRate: SBTI_REDUCTION_RATE_15,
        pastStudies: [],
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
        pastStudies: [],
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
        pastStudies: [],
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
        pastStudies: [],
      })

      expect(result[0]).toEqual({ year: 2020, value: 1000 })
      expect(result[5]).toEqual({ year: 2025, value: 1000 })

      expect(result[6].year).toBe(2026)
      expect(result[6].value).toBeCloseTo(
        1000 - (2026 - 2025) * COMPENSATED_LINEAR_REDUCTION_2025_15C * EMISSION_FACTOR_VALUE,
        1,
      )
      expect(result[7].year).toBe(2027)
      expect(result[7].value).toBeCloseTo(
        1000 - (2027 - 2025) * COMPENSATED_LINEAR_REDUCTION_2025_15C * EMISSION_FACTOR_VALUE,
        1,
      )

      const point2039 = result.find((p) => p.year === 2039)
      // With the new overshoot calculation, we reach zero emissions before 2039
      expect(point2039?.value).toBeCloseTo(0, 1)

      const lastPoint = result[result.length - 1]
      // The trajectory extends to TARGET_YEAR (2050) even though we reach zero earlier
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
        pastStudies: [],
      })

      expect(result[0]).toEqual({ year: 2020, value: 1000 })
      expect(result[5]).toEqual({ year: 2025, value: 1000 })

      expect(result[6].year).toBe(2026)
      expect(result[6].value).toBeCloseTo(
        1000 - (2026 - 2025) * COMPENSATED_LINEAR_REDUCTION_2025_WB2C * EMISSION_FACTOR_VALUE,
        1,
      )

      expect(result[7].year).toBe(2027)
      expect(result[7].value).toBeCloseTo(
        1000 - (2027 - 2025) * COMPENSATED_LINEAR_REDUCTION_2025_WB2C * EMISSION_FACTOR_VALUE,
        1,
      )

      const point2050 = result.find((p) => p.year === 2050)
      expect(point2050?.value).toBeCloseTo(
        1000 - (2050 - 2025) * COMPENSATED_LINEAR_REDUCTION_2025_WB2C * EMISSION_FACTOR_VALUE,
        1,
      )

      const lastPoint = result[result.length - 1]
      // Updated end year: 2025 + 30 = 2055 (with new overshoot calculation)
      expect(lastPoint.year).toBe(2055)
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
        pastStudies: [],
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
        pastStudies: [],
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
        pastStudies: [],
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
        pastStudies: [],
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
        pastStudies: [],
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
        pastStudies: [],
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
        pastStudies: [],
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
        pastStudies: [],
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
        pastStudies: [],
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
        pastStudies: [],
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
        pastStudies: [],
        withDependencies: true,
      })

      const resultWithoutDeps = calculateActionBasedTrajectory({
        studyEmissions: 1000,
        studyStartYear: 2024,
        actions,
        pastStudies: [],
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
        pastStudies: [],
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
        pastStudies: [],
        withDependencies: true,
      })

      const resultWithoutDeps = calculateActionBasedTrajectory({
        studyEmissions: 1000,
        studyStartYear: 2024,
        actions,
        pastStudies: [],
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

  describe('trajectory calculation with past studies', () => {
    describe('single past study', () => {
      test('SBTi 1.5°C with one past study - within threshold', () => {
        const pastStudies = createPastStudies([2022, 1000])
        const currentEmissions = 920
        const currentYear = 2024

        const referenceTrajectory = calculateSBTiTrajectory({
          studyEmissions: 1000,
          studyStartYear: 2022,
          reductionRate: SBTI_REDUCTION_RATE_15,
          pastStudies,
        })
        const expectedValue = getTrajectoryEmissionsAtYear(referenceTrajectory, currentYear)
        expect(expectedValue).not.toBeNull()

        const withinThreshold = expectedValue !== null && isWithinThreshold(currentEmissions, expectedValue)
        expect(withinThreshold).toBe(true)

        const currentTrajectory = calculateSBTiTrajectory({
          studyEmissions: currentEmissions,
          studyStartYear: currentYear,
          reductionRate: SBTI_REDUCTION_RATE_15,
          pastStudies,
          displayCurrentStudyValueOnTrajectory: withinThreshold,
        })

        verifyTrajectoryInterpolation(currentTrajectory, pastStudies, currentYear)
        const currentPoint = currentTrajectory.find((p) => p.year === currentYear)
        expect(currentPoint?.value).toBeCloseTo(currentEmissions, 1)
      })

      test('SBTi 1.5°C with one past study - outside threshold (overshoot)', () => {
        const pastStudies = createPastStudies([2022, 1000])
        const currentEmissions = 1100
        const currentYear = 2024

        const referenceTrajectory = calculateSBTiTrajectory({
          studyEmissions: 1000,
          studyStartYear: 2022,
          reductionRate: SBTI_REDUCTION_RATE_15,
          pastStudies,
        })
        const expectedValue = getTrajectoryEmissionsAtYear(referenceTrajectory, currentYear)
        expect(expectedValue).not.toBeNull()

        const withinThreshold = expectedValue !== null && isWithinThreshold(currentEmissions, expectedValue)
        expect(withinThreshold).toBe(false)

        const currentTrajectory = calculateSBTiTrajectory({
          studyEmissions: currentEmissions,
          studyStartYear: currentYear,
          reductionRate: SBTI_REDUCTION_RATE_15,
          pastStudies,
        })

        verifyTrajectoryInterpolation(currentTrajectory, pastStudies, currentYear)
        const currentPoint = currentTrajectory.find((p) => p.year === currentYear)
        expect(currentPoint?.value).toBeCloseTo(currentEmissions, 1)

        const point2025 = currentTrajectory.find((p) => p.year === 2025)
        const point2027 = currentTrajectory.find((p) => p.year === 2027)
        const refPoint2025 = referenceTrajectory.find((p) => p.year === 2025)
        const refPoint2027 = referenceTrajectory.find((p) => p.year === 2027)
        if (point2025 && point2027 && refPoint2025 && refPoint2027) {
          const currentReduction = (point2025.value - point2027.value) / 2
          const referenceReduction = (refPoint2025.value - refPoint2027.value) / 2
          expect(currentReduction).toBeGreaterThan(referenceReduction)
        }
      })

      test('SBTI - reference before 2020 should interpolate to 2020 using current study after 2020', () => {
        const referenceYear = 2018
        const referenceEmissions = 1000
        const currentYear = 2024
        const currentEmissions = 800

        const pastStudies = createPastStudies([referenceYear, referenceEmissions], [currentYear, currentEmissions])

        const referenceTrajectory = calculateSBTiTrajectory({
          studyEmissions: referenceEmissions,
          studyStartYear: referenceYear,
          reductionRate: SBTI_REDUCTION_RATE_15,
          pastStudies,
        })

        const year2018Point = referenceTrajectory.find((p) => p.year === 2018)
        expect(year2018Point?.value).toBeCloseTo(1000, 1)

        const year2019Point = referenceTrajectory.find((p) => p.year === 2019)
        const expectedInterpolated2019 = 1000 + (1 / 6) * (800 - 1000)
        expect(year2019Point?.value).toBeCloseTo(expectedInterpolated2019, 1)

        const year2020Point = referenceTrajectory.find((p) => p.year === 2020)
        const expectedInterpolated2020 = 1000 + (2 / 6) * (800 - 1000)
        expect(year2020Point?.value).toBeCloseTo(expectedInterpolated2020, 1)

        const year2021Point = referenceTrajectory.find((p) => p.year === 2021)
        const expectedReduction2021 = expectedInterpolated2020 - 1 * SBTI_REDUCTION_RATE_15 * expectedInterpolated2020
        expect(year2021Point?.value).toBeCloseTo(expectedReduction2021, 1)
      })

      test('Custom trajectory with one past study - within threshold', () => {
        const pastStudies = createPastStudies([2022, 1000])
        const currentEmissions = 900
        const currentYear = 2024
        const objectives = [{ targetYear: 2030, reductionRate: 0.05 }]

        const referenceTrajectory = calculateCustomTrajectory({
          studyEmissions: 1000,
          studyStartYear: 2022,
          objectives,
          pastStudies,
        })

        const expectedValue = getTrajectoryEmissionsAtYear(referenceTrajectory, currentYear)
        expect(expectedValue).not.toBeNull()

        const withinThreshold = expectedValue !== null && isWithinThreshold(currentEmissions, expectedValue)
        expect(withinThreshold).toBe(true)

        const currentTrajectory = calculateCustomTrajectory({
          studyEmissions: currentEmissions,
          studyStartYear: currentYear,
          objectives,
          pastStudies,
        })

        verifyTrajectoryInterpolation(currentTrajectory, pastStudies, currentYear)
        const currentPoint = currentTrajectory.find((p) => p.year === currentYear)
        expect(currentPoint?.value).toBeCloseTo(currentEmissions, 1)
      })

      test('Custom trajectory with one past study - overshoot compensation', () => {
        const pastStudies = createPastStudies([2022, 1000])
        const currentEmissions = 1100
        const currentYear = 2024
        const objectives = [
          { targetYear: 2030, reductionRate: 0.05 },
          { targetYear: 2040, reductionRate: 0.08 },
        ]

        const referenceTrajectory = calculateCustomTrajectory({
          studyEmissions: 1000,
          studyStartYear: 2022,
          objectives,
          pastStudies,
        })

        const expectedValue = getTrajectoryEmissionsAtYear(referenceTrajectory, currentYear)
        expect(expectedValue).not.toBeNull()

        const withinThreshold = expectedValue !== null && isWithinThreshold(currentEmissions, expectedValue)
        expect(withinThreshold).toBe(false)

        const currentTrajectory = calculateCustomTrajectory({
          studyEmissions: currentEmissions,
          studyStartYear: currentYear,
          objectives,
          pastStudies,
          overshootAdjustment: {
            referenceTrajectory,
            referenceStudyYear: 2022,
          },
        })

        verifyTrajectoryInterpolation(currentTrajectory, pastStudies, currentYear)
        const currentPoint = currentTrajectory.find((p) => p.year === currentYear)
        expect(currentPoint?.value).toBeCloseTo(currentEmissions, 1)

        const point2025 = currentTrajectory.find((p) => p.year === 2025)
        const point2027 = currentTrajectory.find((p) => p.year === 2027)
        const refPoint2025 = referenceTrajectory.find((p) => p.year === 2025)
        const refPoint2027 = referenceTrajectory.find((p) => p.year === 2027)
        if (point2025 && point2027 && refPoint2025 && refPoint2027) {
          const currentReduction = (point2025.value - point2027.value) / 2
          const referenceReduction = (refPoint2025.value - refPoint2027.value) / 2
          expect(currentReduction).toBeGreaterThan(referenceReduction)
        }
      })

      test('Custom trajectory with SBTI_15 type - should use SBTI overshoot compensation', () => {
        const pastStudies = createPastStudies([2022, 1000])
        const currentEmissions = 1100
        const currentYear = 2025
        const objectives = [
          { targetYear: 2030, reductionRate: SBTI_REDUCTION_RATE_15 },
          { targetYear: 2050, reductionRate: SBTI_REDUCTION_RATE_15 },
        ]

        const referenceTrajectory = calculateCustomTrajectory({
          studyEmissions: 1000,
          studyStartYear: 2022,
          objectives,
          pastStudies,
          trajectoryType: TrajectoryType.SBTI_15,
        })

        const expectedValue = getTrajectoryEmissionsAtYear(referenceTrajectory, currentYear)
        expect(expectedValue).not.toBeNull()

        const withinThreshold = expectedValue !== null && isWithinThreshold(currentEmissions, expectedValue)
        expect(withinThreshold).toBe(false)

        const currentTrajectory = calculateCustomTrajectory({
          studyEmissions: currentEmissions,
          studyStartYear: currentYear,
          objectives,
          pastStudies,
          overshootAdjustment: {
            referenceTrajectory,
            referenceStudyYear: 2022,
          },
          trajectoryType: TrajectoryType.SBTI_15,
        })

        const sbtiTrajectory = calculateSBTiTrajectory({
          studyEmissions: currentEmissions,
          studyStartYear: currentYear,
          reductionRate: SBTI_REDUCTION_RATE_15,
          pastStudies,
        })

        const customPoint2026 = currentTrajectory.find((p) => p.year === 2026)
        const sbtiPoint2026 = sbtiTrajectory.find((p) => p.year === 2026)
        expect(customPoint2026?.value).toBeCloseTo(sbtiPoint2026?.value ?? 0, 1)

        const customPoint2030 = currentTrajectory.find((p) => p.year === 2030)
        const sbtiPoint2030 = sbtiTrajectory.find((p) => p.year === 2030)
        expect(customPoint2030?.value).toBeCloseTo(sbtiPoint2030?.value ?? 0, 1)
      })

      test('Action-based trajectory with one past study', () => {
        const pastStudies = createPastStudies([2022, 1000])
        const currentEmissions = 950
        const currentYear = 2024
        const actions = [
          {
            reductionValue: 100,
            reductionStartYear: '2025-01-01',
            reductionEndYear: '2030-01-01',
            potentialDeduction: 'Quantity',
          },
        ] as Action[]

        const currentTrajectory = calculateActionBasedTrajectory({
          studyEmissions: currentEmissions,
          studyStartYear: currentYear,
          actions,
          pastStudies,
        })

        verifyTrajectoryInterpolation(currentTrajectory, pastStudies, currentYear)
        const currentPoint = currentTrajectory.find((p) => p.year === currentYear)
        expect(currentPoint?.value).toBeCloseTo(currentEmissions, 1)

        const point2025 = currentTrajectory.find((p) => p.year === 2025)
        const point2026 = currentTrajectory.find((p) => p.year === 2026)
        expect(point2025?.value).toBeLessThan(currentEmissions)
        expect(point2026?.value).toBeLessThan(point2025?.value ?? currentEmissions)
      })
    })

    describe('multiple past studies', () => {
      test('SBTi 1.5°C with multiple past studies - interpolation', () => {
        const pastStudies = createPastStudies([2020, 1200], [2022, 1000])
        const currentEmissions = 900
        const currentYear = 2024

        const currentTrajectory = calculateSBTiTrajectory({
          studyEmissions: currentEmissions,
          studyStartYear: currentYear,
          reductionRate: SBTI_REDUCTION_RATE_15,
          pastStudies,
        })

        verifyTrajectoryInterpolation(currentTrajectory, pastStudies, currentYear)

        const point2021 = currentTrajectory.find((p) => p.year === 2021)
        expect(point2021).toBeDefined()
        const expected2021 = 1200 + ((2021 - 2020) / (2022 - 2020)) * (1000 - 1200)
        expect(point2021?.value).toBeCloseTo(expected2021, 1)

        const currentPoint = currentTrajectory.find((p) => p.year === currentYear)
        expect(currentPoint?.value).toBeCloseTo(currentEmissions, 1)
      })

      test('SBTi 1.5°C with multiple past studies - overshoot', () => {
        const pastStudies = createPastStudies([2020, 1200], [2022, 1000])
        const currentEmissions = 1100
        const currentYear = 2025

        const referenceTrajectory = calculateSBTiTrajectory({
          studyEmissions: 1000,
          studyStartYear: 2022,
          reductionRate: SBTI_REDUCTION_RATE_15,
          pastStudies,
        })

        const expectedValue = getTrajectoryEmissionsAtYear(referenceTrajectory, currentYear)
        expect(expectedValue).not.toBeNull()

        const withinThreshold = expectedValue !== null && isWithinThreshold(currentEmissions, expectedValue)
        expect(withinThreshold).toBe(false)

        const currentTrajectory = calculateSBTiTrajectory({
          studyEmissions: currentEmissions,
          studyStartYear: currentYear,
          reductionRate: SBTI_REDUCTION_RATE_15,
          pastStudies,
        })

        verifyTrajectoryInterpolation(currentTrajectory, pastStudies, currentYear)

        const point2026 = currentTrajectory.find((p) => p.year === 2026)
        const point2028 = currentTrajectory.find((p) => p.year === 2028)
        const refPoint2026 = referenceTrajectory.find((p) => p.year === 2026)
        const refPoint2028 = referenceTrajectory.find((p) => p.year === 2028)
        if (point2026 && point2028 && refPoint2026 && refPoint2028) {
          const currentReduction = (point2026.value - point2028.value) / 2
          const referenceReduction = (refPoint2026.value - refPoint2028.value) / 2
          expect(currentReduction).toBeGreaterThan(referenceReduction)
        }
      })

      test('Custom trajectory with multiple past studies', () => {
        const pastStudies = createPastStudies([2021, 1100], [2023, 950])
        const currentEmissions = 900
        const currentYear = 2025
        const objectives = [{ targetYear: 2030, reductionRate: 0.05 }]

        const currentTrajectory = calculateCustomTrajectory({
          studyEmissions: currentEmissions,
          studyStartYear: currentYear,
          objectives,
          pastStudies,
        })

        verifyTrajectoryInterpolation(currentTrajectory, pastStudies, currentYear)

        const point2022 = currentTrajectory.find((p) => p.year === 2022)
        expect(point2022).toBeDefined()
        const expected2022 = 1100 + ((2022 - 2021) / (2023 - 2021)) * (950 - 1100)
        expect(point2022?.value).toBeCloseTo(expected2022, 1)

        const currentPoint = currentTrajectory.find((p) => p.year === currentYear)
        expect(currentPoint?.value).toBeCloseTo(currentEmissions, 1)
      })

      test('Action-based trajectory with multiple past studies', () => {
        const pastStudies = createPastStudies([2020, 1200], [2022, 1000])
        const currentEmissions = 950
        const currentYear = 2024
        const actions = [
          {
            reductionValue: 50,
            reductionStartYear: '2025-01-01',
            reductionEndYear: '2030-01-01',
            potentialDeduction: 'Quantity',
          },
        ] as Action[]

        const currentTrajectory = calculateActionBasedTrajectory({
          studyEmissions: currentEmissions,
          studyStartYear: currentYear,
          actions,
          pastStudies,
        })

        verifyTrajectoryInterpolation(currentTrajectory, pastStudies, currentYear)

        const point2021 = currentTrajectory.find((p) => p.year === 2021)
        expect(point2021).toBeDefined()
        const expected2021 = 1200 + ((2021 - 2020) / (2022 - 2020)) * (1000 - 1200)
        expect(point2021?.value).toBeCloseTo(expected2021, 1)

        const currentPoint = currentTrajectory.find((p) => p.year === currentYear)
        expect(currentPoint?.value).toBeCloseTo(currentEmissions, 1)
      })

      test('Multiple past studies - reference study selection', () => {
        const pastStudies = createPastStudies([2020, 1200], [2022, 1000], [2023, 950])
        const currentEmissions = 900
        const currentYear = 2025

        const currentTrajectory = calculateSBTiTrajectory({
          studyEmissions: currentEmissions,
          studyStartYear: currentYear,
          reductionRate: SBTI_REDUCTION_RATE_15,
          pastStudies,
        })

        verifyTrajectoryInterpolation(currentTrajectory, pastStudies, currentYear)

        pastStudies.forEach((pastStudy) => {
          const point = currentTrajectory.find((p) => p.year === pastStudy.year)
          expect(point?.value).toBeCloseTo(pastStudy.totalCo2, 1)
        })
      })

      test('SBTi trajectory with past studies before 2020', () => {
        const pastStudies = createPastStudies([2018, 1300])
        const currentEmissions = 1000
        const currentYear = 2019

        const currentTrajectory = calculateSBTiTrajectory({
          studyEmissions: currentEmissions,
          studyStartYear: currentYear,
          reductionRate: SBTI_REDUCTION_RATE_15,
          pastStudies,
        })

        const point2018 = currentTrajectory.find((p) => p.year === 2018)
        expect(point2018?.value).toBeCloseTo(1300, 1)

        const point2019 = currentTrajectory.find((p) => p.year === 2019)
        const point2020 = currentTrajectory.find((p) => p.year === 2020)

        expect(point2019?.value).toBeCloseTo(currentEmissions, 1)
        expect(point2020?.value).toBeCloseTo(currentEmissions, 1)

        const point2021 = currentTrajectory.find((p) => p.year === 2021)
        expect(point2021?.value).toBeLessThan(point2020?.value ?? 0)

        const currentPoint = currentTrajectory.find((p) => p.year === currentYear)
        expect(currentPoint?.value).toBeCloseTo(currentEmissions, 1)
      })
    })
  })

  const BUDGET_PRECISION_TOLERANCE_PERCENT = 3

  const expectBudgetsApproximatelyEqual = (actual: number, expected: number) => {
    const difference = Math.abs(actual - expected)
    const relativeDifference = (difference / expected) * 100
    if (relativeDifference > BUDGET_PRECISION_TOLERANCE_PERCENT) {
      console.warn(
        `WARNING: Budget precision exceeds ${BUDGET_PRECISION_TOLERANCE_PERCENT}% threshold. Actual precision: ${relativeDifference.toFixed(2)}%`,
      )
    }
    expect(relativeDifference).toBeLessThanOrEqual(BUDGET_PRECISION_TOLERANCE_PERCENT)
  }

  const calculateBudgetBySummingTrajectory = (trajectory: TrajectoryDataPoint[], referenceYear: number): number => {
    let totalBudget = 0
    const lastYear = trajectory[trajectory.length - 1].year
    for (let i = referenceYear + 1; i <= lastYear; i++) {
      const point = trajectory.find((p) => p.year === i)
      totalBudget += point?.value ?? 0
    }
    return totalBudget
  }

  describe('getObjectivesWithOvershootCompensation - budget equality test', () => {
    const testBudgetEqualityWithCompensation = (
      referenceYear: number,
      currentYear: number,
      referenceEmissions: number,
      currentEmissions: number,
      objectives: Array<{ targetYear: number; reductionRate: number }>,
      pastStudies: PastStudy[],
    ) => {
      const referenceTrajectory = calculateCustomTrajectory({
        studyEmissions: referenceEmissions,
        studyStartYear: referenceYear,
        objectives,
        pastStudies,
      })

      const currentTrajectoryWithCompensation = calculateCustomTrajectory({
        studyEmissions: currentEmissions,
        studyStartYear: currentYear,
        objectives,
        pastStudies,
        overshootAdjustment: {
          referenceTrajectory,
          referenceStudyYear: referenceYear,
        },
      })

      const refEndYear = referenceTrajectory[referenceTrajectory.length - 1].year
      const currentEndYear = currentTrajectoryWithCompensation[currentTrajectoryWithCompensation.length - 1].year

      const referenceTotalBudget = calculateTrajectoryIntegral(referenceTrajectory, referenceYear, refEndYear)
      const currentTotalBudget = calculateTrajectoryIntegral(
        currentTrajectoryWithCompensation,
        referenceYear,
        currentEndYear,
      )

      expectBudgetsApproximatelyEqual(currentTotalBudget, referenceTotalBudget)
    }

    test('compare precision: referenceYear 2024 with only reference study vs multiple past studies', () => {
      const objectives = [
        { targetYear: 2030, reductionRate: 0.02 },
        { targetYear: 2040, reductionRate: 0.04 },
      ]

      testBudgetEqualityWithCompensation(2024, 2025, 1000, 1100, objectives, createPastStudies([2024, 1000]))

      testBudgetEqualityWithCompensation(
        2024,
        2025,
        1000,
        1100,
        objectives,
        createPastStudies([2020, 1200], [2022, 1100], [2024, 1000]),
      )
    })

    test('compare precision: impact of gap between referenceYear and currentYear', () => {
      const objectives = [
        { targetYear: 2030, reductionRate: 0.02 },
        { targetYear: 2040, reductionRate: 0.04 },
      ]

      testBudgetEqualityWithCompensation(2024, 2025, 1000, 1200, objectives, createPastStudies([2024, 1000]))
      testBudgetEqualityWithCompensation(2023, 2025, 1000, 1200, objectives, createPastStudies([2023, 1000]))
      testBudgetEqualityWithCompensation(2022, 2025, 1000, 1200, objectives, createPastStudies([2022, 1000]))
      testBudgetEqualityWithCompensation(2020, 2025, 1000, 1200, objectives, createPastStudies([2020, 1000]))
    })
  })

  describe('SBTI trajectories - budget equality test', () => {
    const testSBTiBudgetEquality = (
      referenceYear: number,
      currentYear: number,
      referenceEmissions: number,
      currentEmissions: number,
      reductionRate: number,
      pastStudies: PastStudy[],
    ) => {
      const referenceTrajectory = calculateSBTiTrajectory({
        studyEmissions: referenceEmissions,
        studyStartYear: referenceYear,
        reductionRate,
        pastStudies,
      })

      const currentTrajectory = calculateSBTiTrajectory({
        studyEmissions: currentEmissions,
        studyStartYear: currentYear,
        reductionRate,
        pastStudies,
      })

      const referenceTotalBudget = calculateBudgetBySummingTrajectory(referenceTrajectory, referenceYear)
      const currentTotalBudget = calculateBudgetBySummingTrajectory(currentTrajectory, referenceYear)

      expectBudgetsApproximatelyEqual(currentTotalBudget, referenceTotalBudget)
    }

    test('SBTI - compare precision with only reference study vs multiple past studies', () => {
      testSBTiBudgetEquality(2024, 2025, 1000, 1100, SBTI_REDUCTION_RATE_15, createPastStudies([2024, 1000]))

      testSBTiBudgetEquality(
        2024,
        2025,
        1000,
        1100,
        SBTI_REDUCTION_RATE_15,
        createPastStudies([2020, 1200], [2022, 1100], [2024, 1000]),
      )

      testSBTiBudgetEquality(2024, 2025, 1000, 1100, SBTI_REDUCTION_RATE_WB2C, createPastStudies([2024, 1000]))

      testSBTiBudgetEquality(
        2024,
        2025,
        1000,
        1100,
        SBTI_REDUCTION_RATE_WB2C,
        createPastStudies([2020, 1200], [2022, 1100], [2024, 1000]),
      )
    })

    test('SBTI - impact of gap between referenceYear and currentYear', () => {
      testSBTiBudgetEquality(2024, 2025, 1000, 1100, SBTI_REDUCTION_RATE_15, createPastStudies([2024, 1000]))
      testSBTiBudgetEquality(2023, 2025, 1000, 1200, SBTI_REDUCTION_RATE_15, createPastStudies([2023, 1000]))
      testSBTiBudgetEquality(2022, 2025, 1000, 1300, SBTI_REDUCTION_RATE_15, createPastStudies([2022, 1000]))

      testSBTiBudgetEquality(2024, 2025, 1000, 1100, SBTI_REDUCTION_RATE_WB2C, createPastStudies([2024, 1000]))
      testSBTiBudgetEquality(2023, 2025, 1000, 1200, SBTI_REDUCTION_RATE_WB2C, createPastStudies([2023, 1000]))
      testSBTiBudgetEquality(2022, 2025, 1000, 1300, SBTI_REDUCTION_RATE_WB2C, createPastStudies([2022, 1000]))
    })

    test('SBTI - precision with larger emissions differences', () => {
      testSBTiBudgetEquality(2024, 2025, 1000, 1500, SBTI_REDUCTION_RATE_15, createPastStudies([2024, 1000]))
      testSBTiBudgetEquality(2024, 2025, 1000, 2000, SBTI_REDUCTION_RATE_15, createPastStudies([2024, 1000]))

      testSBTiBudgetEquality(2024, 2025, 1000, 1500, SBTI_REDUCTION_RATE_WB2C, createPastStudies([2024, 1000]))
      testSBTiBudgetEquality(2024, 2025, 1000, 2000, SBTI_REDUCTION_RATE_WB2C, createPastStudies([2024, 1000]))
    })

    test('SBTI - budget equality with past study before 2020, overshoot scenario', () => {
      testSBTiBudgetEquality(
        2018,
        2024,
        1000,
        1100,
        SBTI_REDUCTION_RATE_15,
        createPastStudies([2018, 1000], [2024, 1100]),
      )

      testSBTiBudgetEquality(
        2019,
        2025,
        1000,
        1200,
        SBTI_REDUCTION_RATE_15,
        createPastStudies([2019, 1000], [2025, 1200]),
      )
    })
  })
})
