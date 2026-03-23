import type { BaseObjective, PastStudy, TrajectoryDataPoint, TrajectoryWithObjectives } from '@/types/trajectory.types'
import { expect } from '@jest/globals'
import { Action, StudyResultUnit, TrajectoryType } from '@repo/db-common'
import { createGeneralSectenData } from './secten.test-utils'
import { calculateSNBCTrajectory } from './snbc'
import {
  calculateActionBasedTrajectory,
  calculateCustomTrajectory,
  calculateSBTiTrajectory,
  calculateTrajectoryIntegral,
  calculateTrajectoryYearBounds,
  getDefaultSBTIReductionRate,
  getTrajectoryEmissionsAtYear,
  isWithinThreshold,
  SBTI_REDUCTION_RATE_15,
  SBTI_REDUCTION_RATE_WB2C,
  TARGET_YEAR,
} from './trajectory'

// TODO: ESM module issue with Jest. Remove these mocks when moving to Vitest
jest.mock('../services/file', () => ({ download: jest.fn() }))
jest.mock('../services/auth', () => ({ auth: jest.fn() }))
jest.mock('uuid', () => ({ v4: jest.fn() }))
jest.mock('next-intl/server', () => ({ getTranslations: jest.fn(() => (key: string) => key) }))
jest.mock('../components/pages/TrajectoryPage', () => ({
  TRAJECTORY_15_ID: 'sbti-15',
  TRAJECTORY_WB2C_ID: 'sbti-wb2c',
  TRAJECTORY_SNBC_GENERAL_ID: 'snbc-general',
}))

const DEFAULT_LINEAR_REDUCTION_15C = 42
const DEFAULT_LINEAR_REDUCTION_WB2C = 25
// Updated values after fixing overshoot calculation for SBTi (now calculates overshoot even without historical data)
const COMPENSATED_LINEAR_REDUCTION_2025_15C = 7.241379310344829
const COMPENSATED_LINEAR_REDUCTION_2025_WB2C = 3.333333333333333
const EMISSION_FACTOR_VALUE = 10
const DEFAULT_TRAJECTORY = [
  { year: 1990, value: 1200 },
  { year: 2000, value: 1100 },
  { year: 2018, value: 1000 },
  { year: 2020, value: 1000 },
]

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
    expect(point?.value).toBe(pastStudy.totalCo2)
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
        defaultTrajectory: DEFAULT_TRAJECTORY,
      })

      expect(result).toHaveLength(34)
      expect(result[0]).toEqual({ year: 1990, value: 1200 })
      expect(result.find((p) => p.year === 2020)?.value).toEqual(1000)

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
        defaultTrajectory: DEFAULT_TRAJECTORY,
      })

      expect(result).toHaveLength(44)
      expect(result[0]).toEqual({ year: 1990, value: 1200 })
      expect(result.find((p) => p.year === 2020)?.value).toEqual(1000)
      expect(result.find((p) => p.year === 2050)?.value).toBeCloseTo(
        Math.max(0, 1000 - (2050 - 2020) * DEFAULT_LINEAR_REDUCTION_WB2C),
        1,
      )

      const result2060 = result.find((p) => p.year === 2060)
      expect(result2060?.value).toBeCloseTo(Math.max(0, 1000 - (2060 - 2020) * DEFAULT_LINEAR_REDUCTION_WB2C), 1)
    })

    test('should start graph from default trajectory year and follow emissions until study start year', () => {
      const result = calculateSBTiTrajectory({
        studyEmissions: 1000,
        studyStartYear: 2018,
        reductionRate: SBTI_REDUCTION_RATE_15,
        pastStudies: [],
        defaultTrajectory: DEFAULT_TRAJECTORY,
      })

      expect(result[0]).toEqual({ year: 1990, value: 1200 })
      expect(result[1]).toEqual({ year: 2000, value: 1100 })
      expect(result[2]).toEqual({ year: 2018, value: 1000 })
      expect(result[3]).toEqual({ year: 2020, value: 1000 })
      expect(result[4].year).toBe(2021)
      expect(Math.round(result[4].value)).toBe(958)
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
        defaultTrajectory: DEFAULT_TRAJECTORY,
      })

      expect(result[0]).toEqual({ year: 1990, value: 1200 })
      expect(result.find((p) => p.year === 2025)?.value).toEqual(1000)

      expect(result.find((p) => p.year === 2026)?.value).toBeCloseTo(
        1000 - (2026 - 2025) * COMPENSATED_LINEAR_REDUCTION_2025_15C * EMISSION_FACTOR_VALUE,
        1,
      )
      expect(result.find((p) => p.year === 2027)?.value).toBeCloseTo(
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
        defaultTrajectory: DEFAULT_TRAJECTORY,
      })

      expect(result[0]).toEqual({ year: 1990, value: 1200 })
      expect(result.find((p) => p.year === 2025)?.value).toEqual(1000)

      expect(result.find((p) => p.year === 2026)?.value).toBeCloseTo(
        1000 - (2026 - 2025) * COMPENSATED_LINEAR_REDUCTION_2025_WB2C * EMISSION_FACTOR_VALUE,
        1,
      )

      expect(result.find((p) => p.year === 2027)?.value).toBeCloseTo(
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

  describe('SBTi trajectory with SNBC default trajectory', () => {
    test('with defaultTrajectory and past study before 2020 - years before past study use SNBC trajectory', () => {
      const sectenData = createGeneralSectenData()
      const pastStudies = createPastStudies([2018, 1300])
      const snbcTrajectory = calculateSNBCTrajectory({
        studyEmissions: 1000,
        studyStartYear: 2025,
        sectenData,
        pastStudies,
      })

      const result = calculateSBTiTrajectory({
        studyEmissions: 1000,
        studyStartYear: 2025,
        reductionRate: SBTI_REDUCTION_RATE_15,
        pastStudies,
        defaultTrajectory: snbcTrajectory,
      })

      // Pivot year = min(2018, 2020) = 2018. Years before 2018 should use SNBC.
      const point2015 = result.find((p) => p.year === 2015)
      const snbcPoint2015 = snbcTrajectory.find((p) => p.year === 2015)
      expect(point2015?.value).toEqual(snbcPoint2015?.value)

      const point2017 = result.find((p) => p.year === 2017)
      const snbcPoint2017 = snbcTrajectory.find((p) => p.year === 2017)
      expect(point2017?.value).toEqual(snbcPoint2017?.value)

      // From pivot year (2018) onward, SBTi historical interpolation applies
      const point2018 = result.find((p) => p.year === 2018)
      expect(point2018?.value).toEqual(1300)

      // Study start year remains at study emissions
      const point2025 = result.find((p) => p.year === 2025)
      expect(point2025?.value).toEqual(1000)
    })

    test('with defaultTrajectory and studyStartYear before 2020, past study before studyStartYear - years before past study use SNBC', () => {
      const pastStudies = createPastStudies([2015, 1500])
      const defaultTrajectoryWithPastStudy = [...DEFAULT_TRAJECTORY, { year: 2015, value: 1500 }].sort(
        (a, b) => a.year - b.year,
      )

      const result = calculateSBTiTrajectory({
        studyEmissions: 1000,
        studyStartYear: 2019,
        reductionRate: SBTI_REDUCTION_RATE_15,
        pastStudies,
        defaultTrajectory: defaultTrajectoryWithPastStudy,
      })

      // Pivot year = min(2015, 2020) = 2015. Years before 2015 should use SNBC.
      const point2000 = result.find((p) => p.year === 2000)
      const snbcPoint2000 = DEFAULT_TRAJECTORY.find((p) => p.year === 2000)
      expect(point2000?.value).toEqual(snbcPoint2000?.value)

      // At pivot year (2015), historical data applies
      const point2015 = result.find((p) => p.year === 2015)
      expect(point2015?.value).toBeCloseTo(1500, 1)
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
        defaultTrajectory: DEFAULT_TRAJECTORY,
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
      expect(lastPoint.year).toBe(2030)
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
        defaultTrajectory: DEFAULT_TRAJECTORY,
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

      // After last objective we keep the same result
      const lastPoint = result[result.length - 1]
      expect(lastPoint.year).toBe(2040)
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
        defaultTrajectory: DEFAULT_TRAJECTORY,
      })

      const yearlyReduction = studyEmissions * 0.05

      const point2030 = result.find((p) => p.year === 2030) as TrajectoryDataPoint
      expect(point2030?.value).toBeCloseTo(1000 - (2030 - 2024) * yearlyReduction, 1)

      const newstudyEmissions = point2030.value
      const newYearlyReduction = newstudyEmissions * 0.08

      const point2040 = result.find((p) => p.year === 2040)
      expect(point2040?.value).toBeCloseTo(newstudyEmissions - (2040 - 2030) * newYearlyReduction, 1)
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
        defaultTrajectory: DEFAULT_TRAJECTORY,
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

    describe('custom trajectory with reference year', () => {
      test('reference year 2015 - custom type should decrease from 2016', () => {
        const referenceYear = 2015
        const referenceEmissions = 1000
        const objectives = [{ targetYear: 2030, reductionRate: 0.05 }]

        const result = calculateCustomTrajectory({
          studyEmissions: referenceEmissions,
          studyStartYear: referenceYear,
          objectives,
          pastStudies: [],
          trajectoryType: TrajectoryType.CUSTOM,
          minYear: referenceYear,
          defaultTrajectory: DEFAULT_TRAJECTORY,
        })

        const point2015 = result.find((p) => p.year === 2015)
        expect(point2015?.value).toBe(1000)

        const point2016 = result.find((p) => p.year === 2016)
        const yearlyReduction = referenceEmissions * 0.05
        expect(point2016?.value).toBeCloseTo(1000 - yearlyReduction, 1)

        const point2017 = result.find((p) => p.year === 2017)
        expect(point2017?.value).toBeCloseTo(1000 - 2 * yearlyReduction, 1)
      })

      test('reference year 2015 - custom SBTi type should decrease after 2020', () => {
        const referenceYear = 2015
        const referenceEmissions = 1000
        const objectives = [
          { targetYear: 2030, reductionRate: SBTI_REDUCTION_RATE_15 },
          { targetYear: 2050, reductionRate: SBTI_REDUCTION_RATE_15 },
        ]

        const result = calculateCustomTrajectory({
          studyEmissions: referenceEmissions,
          studyStartYear: referenceYear,
          objectives,
          pastStudies: [],
          trajectoryType: TrajectoryType.SBTI_15,
          minYear: referenceYear,
          defaultTrajectory: DEFAULT_TRAJECTORY,
        })

        const point2020 = result.find((p) => p.year === 2020)
        expect(point2020?.value).toBeCloseTo(1000, 1)

        // Should start decreasing from 2021
        const point2021 = result.find((p) => p.year === 2021)
        const expected2021 = 1000 - 1 * SBTI_REDUCTION_RATE_15 * 1000
        expect(point2021?.value).toBeCloseTo(expected2021, 1)

        const point2022 = result.find((p) => p.year === 2022)
        const expected2022 = 1000 - 2 * SBTI_REDUCTION_RATE_15 * 1000
        expect(point2022?.value).toBeCloseTo(expected2022, 1)
      })

      test('reference year 2022 - custom type should decrease from 2023', () => {
        const referenceYear = 2022
        const referenceEmissions = 1000
        const objectives = [{ targetYear: 2030, reductionRate: 0.05 }]

        const result = calculateCustomTrajectory({
          studyEmissions: referenceEmissions,
          studyStartYear: referenceYear,
          objectives,
          pastStudies: [],
          trajectoryType: TrajectoryType.CUSTOM,
          minYear: referenceYear,
          defaultTrajectory: DEFAULT_TRAJECTORY,
        })

        const point2022 = result.find((p) => p.year === 2022)
        expect(point2022?.value).toBe(1000)

        const point2023 = result.find((p) => p.year === 2023)
        const yearlyReduction = referenceEmissions * 0.05
        expect(point2023?.value).toBeCloseTo(1000 - yearlyReduction, 1)

        const point2024 = result.find((p) => p.year === 2024)
        expect(point2024?.value).toBeCloseTo(1000 - 2 * yearlyReduction, 1)
      })

      test('reference year 2022 - custom SBTi type should decrease from 2023', () => {
        const referenceYear = 2022
        const referenceEmissions = 1000
        const objectives = [
          { targetYear: 2030, reductionRate: SBTI_REDUCTION_RATE_15 },
          { targetYear: 2050, reductionRate: SBTI_REDUCTION_RATE_15 },
        ]

        const result = calculateCustomTrajectory({
          studyEmissions: referenceEmissions,
          studyStartYear: referenceYear,
          objectives,
          pastStudies: [],
          trajectoryType: TrajectoryType.SBTI_15,
          minYear: referenceYear,
          defaultTrajectory: DEFAULT_TRAJECTORY,
        })

        const point2022 = result.find((p) => p.year === 2022)
        expect(point2022?.value).toBeCloseTo(1000, 1)

        // Should start decreasing from 2023 (referenceYear + 1)
        // Note: When studyStartYear > 2020, overshoot compensation is applied,
        // so the reduction rate may differ from the base SBTI_REDUCTION_RATE_15
        const point2023 = result.find((p) => p.year === 2023)
        expect(point2023).toBeDefined()
        expect(point2023?.value).toBeLessThan(1000)
        expect(point2023?.value).toBeGreaterThan(0)

        const point2024 = result.find((p) => p.year === 2024)
        expect(point2024).toBeDefined()
        expect(point2024?.value).toBeLessThan(point2023?.value ?? 0)
        expect(point2024?.value).toBeGreaterThan(0)
      })
    })

    test('Custom trajectory with 4 objectives - continuous reductions', () => {
      const currentYear = 2024
      const currentEmissions = 850

      const objectives = [
        { targetYear: 2025, reductionRate: 0.03 },
        { targetYear: 2030, reductionRate: 0.05 },
        { targetYear: 2035, reductionRate: 0.07 },
        { targetYear: 2040, reductionRate: 0.1 },
      ]

      const trajectory = calculateCustomTrajectory({
        studyEmissions: currentEmissions,
        studyStartYear: currentYear,
        objectives,
        defaultTrajectory: DEFAULT_TRAJECTORY,
      })

      const startPoint = trajectory.find((p) => p.year === currentYear)
      expect(startPoint?.value).toBeCloseTo(currentEmissions, 1)

      const point2025 = trajectory.find((p) => p.year === 2025)
      expect(point2025?.value).toBeCloseTo(824.5, 1)

      const point2026 = trajectory.find((p) => p.year === 2026)
      expect(point2026?.value).toBeCloseTo(783.275, 1)

      const point2030 = trajectory.find((p) => p.year === 2030)
      expect(point2030?.value).toBeCloseTo(618.375, 1)
    })
  })

  describe('calculateCustomTrajectory with scope groups', () => {
    const studyEmissions = 1000
    const studyStartYear = 2024

    test('basic: sub-objective (30%) + global (70%) → proportional reductions', () => {
      const objectiveGroups = [
        {
          ratio: 0.3,
          objectives: [{ targetYear: 2030, reductionRate: 0.1 }],
        },
        {
          ratio: 0.7,
          objectives: [{ targetYear: 2030, reductionRate: 0.05 }],
        },
      ]

      const result = calculateCustomTrajectory({
        studyEmissions,
        studyStartYear,
        objectives: [{ targetYear: 2030, reductionRate: 0.05 }],
        objectiveGroups,
        defaultTrajectory: DEFAULT_TRAJECTORY,
      })

      // sub group: 300 * 0.1 = 30/yr, global group: 700 * 0.05 = 35/yr → total 65/yr
      const point2025 = result.find((p) => p.year === 2025)
      expect(point2025?.value).toBeCloseTo(1000 - 65, 1)

      const point2030 = result.find((p) => p.year === 2030)
      expect(point2030?.value).toBeCloseTo(1000 - 6 * 65, 1)
    })

    test('cascade: sub-objective ends in 2030, global continues to 2040', () => {
      const objectiveGroups = [
        {
          ratio: 0.4,
          objectives: [
            { targetYear: 2030, reductionRate: 0.1 },
            { targetYear: 2040, reductionRate: 0.05 }, // cascade after 2030
          ],
        },
        {
          ratio: 0.6,
          objectives: [{ targetYear: 2040, reductionRate: 0.04 }],
        },
      ]

      const result = calculateCustomTrajectory({
        studyEmissions,
        studyStartYear,
        objectives: [{ targetYear: 2040, reductionRate: 0.04 }],
        objectiveGroups,
        defaultTrajectory: DEFAULT_TRAJECTORY,
      })

      // sub: 400 * 0.1 = 40/yr for 2025-2030
      // global: 600 * 0.04 = 24/yr for 2025-2030
      const point2030 = result.find((p) => p.year === 2030)
      expect(point2030?.value).toBeCloseTo(1000 - 6 * (40 + 24), 1)

      // After 2030: sub switches to 0.05, yearlyReduction recalculated on remaining emissions
      // global yearlyReduction was fixed at 600 * 0.04 = 24 (constant for the whole segment)
      const subAt2030 = 400 - 6 * 40
      const globalAt2030 = 600 - 6 * 24
      const subYearlyAfter = subAt2030 * 0.05
      const globalYearlyFixed = 600 * 0.04 // fixed at segment start
      const point2031 = result.find((p) => p.year === 2031)
      expect(point2031?.value).toBeCloseTo(subAt2030 - subYearlyAfter + globalAt2030 - globalYearlyFixed, 1)
    })

    test('retro-compatible: without objectiveGroups = identical result to existing', () => {
      const objectives = [{ targetYear: 2030, reductionRate: 0.05 }]

      const withoutGroups = calculateCustomTrajectory({
        studyEmissions,
        studyStartYear,
        objectives,
        defaultTrajectory: DEFAULT_TRAJECTORY,
      })

      const objectiveGroups = [{ ratio: 1, objectives }]
      const withSingleGroup = calculateCustomTrajectory({
        studyEmissions,
        studyStartYear,
        objectives,
        objectiveGroups,
        defaultTrajectory: DEFAULT_TRAJECTORY,
      })

      // Both should have the same future values (objectiveGroups path skips historical points)
      const futureWithout = withoutGroups.filter((p) => p.year > studyStartYear)
      const futureWith = withSingleGroup.filter((p) => p.year > studyStartYear)
      expect(futureWith.length).toBe(futureWithout.length)
      futureWith.forEach((p, i) => {
        expect(p.value).toBeCloseTo(futureWithout[i].value, 5)
      })
    })

    test('ratio 0: sub-objective filtered out → does not affect emissions', () => {
      const objectiveGroups = [
        {
          ratio: 0,
          objectives: [{ targetYear: 2030, reductionRate: 0.5 }],
        },
        {
          ratio: 1,
          objectives: [{ targetYear: 2030, reductionRate: 0.05 }],
        },
      ]

      const result = calculateCustomTrajectory({
        studyEmissions,
        studyStartYear,
        objectives: [{ targetYear: 2030, reductionRate: 0.05 }],
        objectiveGroups,
        defaultTrajectory: DEFAULT_TRAJECTORY,
      })

      // Only global group (ratio=1) affects: 1000 * 0.05 = 50/yr
      const point2025 = result.find((p) => p.year === 2025)
      expect(point2025?.value).toBeCloseTo(1000 - 50, 1)
    })

    test('multi-level: specific scope (20%) with 3 objective segments + global (80%)', () => {
      const objectiveGroups = [
        {
          ratio: 0.2, // 20% of total
          objectives: [
            { targetYear: 2030, reductionRate: 0.1 },
            { targetYear: 2040, reductionRate: 0.06 }, // cascades to site level after 2030
            { targetYear: 2050, reductionRate: 0.04 }, // cascades to global after 2040
          ],
        },
        {
          ratio: 0.8,
          objectives: [{ targetYear: 2050, reductionRate: 0.03 }],
        },
      ]

      const result = calculateCustomTrajectory({
        studyEmissions,
        studyStartYear,
        objectives: [{ targetYear: 2050, reductionRate: 0.03 }],
        objectiveGroups,
        defaultTrajectory: DEFAULT_TRAJECTORY,
      })

      const specificAt2030 = 200 - 6 * (200 * 0.1)
      const globalAt2030 = 800 - 6 * (800 * 0.03)

      const point2030 = result.find((p) => p.year === 2030)
      expect(point2030?.value).toBeCloseTo(specificAt2030 + globalAt2030, 1)

      const point2050 = result.find((p) => p.year === 2050)
      expect(point2050).toBeDefined()
      expect(point2050!.value).toBeGreaterThan(0)
    })

    test('Overlapping objectives: 1000 tCO2, energy 10%, global 5% 2030-2050, sub energy 10% 2035-2045', () => {
      const objectiveGroups = [
        {
          ratio: 0.1,
          objectives: [
            { targetYear: 2035, reductionRate: 0.05 },
            { targetYear: 2045, reductionRate: 0.1 },
            { targetYear: 2050, reductionRate: 0.05 },
          ],
        },
        {
          ratio: 0.9,
          objectives: [{ targetYear: 2050, reductionRate: 0.05 }],
        },
      ]

      const result = calculateCustomTrajectory({
        studyEmissions: 1000,
        studyStartYear: 2030,
        objectives: [{ targetYear: 2050, reductionRate: 0.05 }],
        objectiveGroups,
        defaultTrajectory: DEFAULT_TRAJECTORY,
      })

      // Energy: 100 tCO2, -5t/yr (5% of 100) from 2030→2035
      // Non-energy: 900 tCO2, -45t/yr (5% of 900) from 2030→2050
      const energyAt2035 = 100 - 5 * 5
      const globalAt2035 = 900 - 5 * 45
      const point2035 = result.find((p) => p.year === 2035)
      expect(point2035?.value).toBeCloseTo(energyAt2035 + globalAt2035, 1)

      // Energy switches to 10% at 2035: yearlyReduction = 75 * 0.1 = 7.5
      const energyYearly10 = energyAt2035 * 0.1
      const energyAt2040 = energyAt2035 - 5 * energyYearly10
      const globalAt2040 = globalAt2035 - 5 * 45
      const point2040 = result.find((p) => p.year === 2040)
      expect(point2040?.value).toBeCloseTo(energyAt2040 + globalAt2040, 1)

      // Energy at 2045: fully reduced to 0, non-energy at 675 - 10*45 = 225
      const energyAt2045 = energyAt2035 - 10 * energyYearly10
      const globalAt2045 = globalAt2040 - 5 * 45
      expect(energyAt2045).toBeCloseTo(0, 1)
      expect(globalAt2045).toBeCloseTo(225, 1)
      const point2045 = result.find((p) => p.year === 2045)
      expect(point2045?.value).toBeCloseTo(225, 1)

      // At 2050: non-energy also reaches 0 (900 - 20*45 = 0)
      const point2050 = result.find((p) => p.year === 2050)
      expect(point2050?.value).toBeCloseTo(0, 1)
    })
  })

  describe('getReductionRatePerType', () => {
    test('should return correct reduction rate for SBTI_15', () => {
      const rate = getDefaultSBTIReductionRate(TrajectoryType.SBTI_15)
      expect(rate).toBe(SBTI_REDUCTION_RATE_15)
    })

    test('should return correct reduction rate for SBTI_WB2C', () => {
      const rate = getDefaultSBTIReductionRate(TrajectoryType.SBTI_WB2C)
      expect(rate).toBe(SBTI_REDUCTION_RATE_WB2C)
    })

    test('should return undefined for CUSTOM type', () => {
      const rate = getDefaultSBTIReductionRate(TrajectoryType.CUSTOM)
      expect(rate).toBeUndefined()
    })

    test('should return undefined for SNBC_GENERAL type', () => {
      const rate = getDefaultSBTIReductionRate(TrajectoryType.SNBC_GENERAL)
      expect(rate).toBeUndefined()
    })
  })

  describe('calculateActionBasedTrajectory', () => {
    test('should return base emissions with flat line to 2050 when no quantitative actions', () => {
      const actions = [
        {
          reductionValueKg: null,
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
        studyUnit: StudyResultUnit.K,
      })

      expect(result[0]).toEqual({ year: 2020, value: 1000 })
      expect(result.find((p) => p.year === 2024)).toEqual({ year: 2024, value: 1000 })
      expect(result.find((p) => p.year === 2050)).toEqual({ year: 2050, value: 1000 })
    })

    test('should calculate trajectory with single quantitative action', () => {
      const actions = [
        {
          reductionValueKg: 100,
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
        studyUnit: StudyResultUnit.K,
      })

      const annualReduction = 100 / (2030 - 2025 + 1)

      expect(result.find((p) => p.year === 2024)).toEqual({ year: 2024, value: 1000 })
      expect(result.find((p) => p.year === 2025)?.value).toBeCloseTo(1000 - annualReduction, 1)
      expect(result.find((p) => p.year === 2026)?.value).toBeCloseTo(1000 - 2 * annualReduction, 1)
      expect(result.find((p) => p.year === 2027)?.value).toBeCloseTo(1000 - 3 * annualReduction, 1)
      expect(result.find((p) => p.year === 2030)?.value).toBeCloseTo(1000 - 6 * annualReduction, 1)
    })

    test('should calculate trajectory with multiple overlapping actions', () => {
      const actions = [
        {
          reductionValueKg: 100,
          reductionStartYear: '2025-01-01',
          reductionEndYear: '2030-01-01',
          potentialDeduction: 'Quantity',
        },
        {
          reductionValueKg: 50,
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
        studyUnit: StudyResultUnit.K,
      })

      const action1AnnualReduction = 100 / (2030 - 2025 + 1)
      const action2AnnualReduction = 50 / (2032 - 2027 + 1)

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
          reductionValueKg: 100,
          reductionStartYear: '2025-01-01',
          reductionEndYear: '2030-01-01',
          potentialDeduction: 'Quality',
        },
        {
          reductionValueKg: null,
          reductionStartYear: '2025-01-01',
          reductionEndYear: '2030-01-01',
          potentialDeduction: 'Quantity',
        },
        {
          reductionValueKg: 50,
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
        studyUnit: StudyResultUnit.K,
      })

      const annualReduction = 50 / (2030 - 2026 + 1)
      const point2026 = result.find((p) => p.year === 2026)
      expect(point2026?.value).toBeCloseTo(1000 - annualReduction, 1)

      const point2027 = result.find((p) => p.year === 2027)
      expect(point2027?.value).toBeCloseTo(1000 - 2 * annualReduction, 1)
    })

    test('should correctly sum single-year action with multi-year action in the same year', () => {
      const actions = [
        {
          reductionValueKg: 100,
          reductionStartYear: '2026-01-01',
          reductionEndYear: '2026-01-01',
          potentialDeduction: 'Quantity',
        },
        {
          reductionValueKg: 50,
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
        studyUnit: StudyResultUnit.K,
      })

      const action2AnnualReduction = 50 / (2030 - 2025 + 1)

      const expectedResult2026 = 1000 - 2 * action2AnnualReduction - 100

      expect(result.find((p) => p.year === 2024)).toEqual({ year: 2024, value: 1000 })
      expect(result.find((p) => p.year === 2025)?.value).toBeCloseTo(1000 - action2AnnualReduction, 1)
      expect(result.find((p) => p.year === 2026)?.value).toBeCloseTo(expectedResult2026, 1)
      expect(result.find((p) => p.year === 2027)?.value).toBeCloseTo(expectedResult2026 - action2AnnualReduction, 1)
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
          defaultTrajectory: DEFAULT_TRAJECTORY,
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
          defaultTrajectory: DEFAULT_TRAJECTORY,
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
          defaultTrajectory: DEFAULT_TRAJECTORY,
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
          defaultTrajectory: DEFAULT_TRAJECTORY,
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
          defaultTrajectory: DEFAULT_TRAJECTORY,
        })

        const year2018Point = referenceTrajectory.find((p) => p.year === 2018)
        expect(year2018Point?.value).toBeCloseTo(1000, 1)

        const year2019Point = referenceTrajectory.find((p) => p.year === 2019)
        expect(year2019Point?.value).toBeCloseTo(1000, 1)

        const year2020Point = referenceTrajectory.find((p) => p.year === 2020)
        expect(year2020Point?.value).toBeCloseTo(1000, 1)

        const year2021Point = referenceTrajectory.find((p) => p.year === 2021)
        const expectedReduction2021 = 1000 - 1 * SBTI_REDUCTION_RATE_15 * 1000
        expect(year2021Point?.value).toBeCloseTo(expectedReduction2021, 1)
      })

      test('Custom trajectory with SBTI_15 type - reference before 2020 should interpolate to 2020 using current study after 2020', () => {
        const referenceYear = 2018
        const referenceEmissions = 1000
        const currentYear = 2024
        const currentEmissions = 800

        const pastStudies = createPastStudies([referenceYear, referenceEmissions], [currentYear, currentEmissions])
        const objectives = [
          { targetYear: 2030, reductionRate: SBTI_REDUCTION_RATE_15 },
          { targetYear: 2050, reductionRate: SBTI_REDUCTION_RATE_15 },
        ]

        const referenceTrajectory = calculateCustomTrajectory({
          studyEmissions: referenceEmissions,
          studyStartYear: referenceYear,
          objectives,
          pastStudies,
          trajectoryType: TrajectoryType.SBTI_15,
          defaultTrajectory: DEFAULT_TRAJECTORY,
        })

        const year2018Point = referenceTrajectory.find((p) => p.year === 2018)
        expect(year2018Point?.value).toBeCloseTo(1000, 1)

        const year2019Point = referenceTrajectory.find((p) => p.year === 2019)
        expect(year2019Point?.value).toBeCloseTo(1000, 1)

        const year2020Point = referenceTrajectory.find((p) => p.year === 2020)
        expect(year2020Point?.value).toBeCloseTo(1000, 1)

        const year2021Point = referenceTrajectory.find((p) => p.year === 2021)
        const expectedReduction2021 = 1000 - 1 * SBTI_REDUCTION_RATE_15 * 1000
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
          defaultTrajectory: DEFAULT_TRAJECTORY,
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
          defaultTrajectory: DEFAULT_TRAJECTORY,
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
          defaultTrajectory: DEFAULT_TRAJECTORY,
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
          defaultTrajectory: DEFAULT_TRAJECTORY,
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
          defaultTrajectory: DEFAULT_TRAJECTORY,
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
          defaultTrajectory: DEFAULT_TRAJECTORY,
        })

        const sbtiTrajectory = calculateSBTiTrajectory({
          studyEmissions: currentEmissions,
          studyStartYear: currentYear,
          reductionRate: SBTI_REDUCTION_RATE_15,
          pastStudies,
          defaultTrajectory: DEFAULT_TRAJECTORY,
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
            reductionValueKg: 100,
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
          studyUnit: StudyResultUnit.K,
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
        const pastStudies = createPastStudies([2019, 1200], [2022, 1000])
        const currentEmissions = 900
        const currentYear = 2024
        const defaultTrajectoryWithPastStudy = [
          { year: 1990, value: 1200 },
          { year: 2019, value: 1200 },
        ]

        const currentTrajectory = calculateSBTiTrajectory({
          studyEmissions: currentEmissions,
          studyStartYear: currentYear,
          reductionRate: SBTI_REDUCTION_RATE_15,
          pastStudies,
          defaultTrajectory: defaultTrajectoryWithPastStudy,
        })

        verifyTrajectoryInterpolation(currentTrajectory, pastStudies, currentYear)

        const point2021 = currentTrajectory.find((p) => p.year === 2021)
        expect(point2021).toBeDefined()
        const expected2021 = 1200 + ((2021 - 2019) / (2022 - 2019)) * (1000 - 1200)
        expect(point2021?.value).toBeCloseTo(expected2021, 1)

        const currentPoint = currentTrajectory.find((p) => p.year === currentYear)
        expect(currentPoint?.value).toBeCloseTo(currentEmissions, 1)
      })

      test('SBTi 1.5°C with multiple past studies - overshoot', () => {
        const pastStudies = createPastStudies([2021, 1200], [2022, 1000])
        const currentEmissions = 1100
        const currentYear = 2025

        const referenceTrajectory = calculateSBTiTrajectory({
          studyEmissions: 1000,
          studyStartYear: 2022,
          reductionRate: SBTI_REDUCTION_RATE_15,
          pastStudies,
          defaultTrajectory: DEFAULT_TRAJECTORY,
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
          defaultTrajectory: DEFAULT_TRAJECTORY,
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
          defaultTrajectory: DEFAULT_TRAJECTORY,
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
            reductionValueKg: 50,
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
          studyUnit: StudyResultUnit.K,
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
        const pastStudies = createPastStudies([2021, 1200], [2022, 1000], [2023, 950])
        const currentEmissions = 900
        const currentYear = 2025

        const currentTrajectory = calculateSBTiTrajectory({
          studyEmissions: currentEmissions,
          studyStartYear: currentYear,
          reductionRate: SBTI_REDUCTION_RATE_15,
          pastStudies,
          defaultTrajectory: DEFAULT_TRAJECTORY,
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
          defaultTrajectory: DEFAULT_TRAJECTORY,
        })

        const point2018 = currentTrajectory.find((p) => p.year === 2018)
        expect(point2018?.value).toBe(1000)

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

  const BUDGET_PRECISION_TOLERANCE_PERCENT = 1

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
      objectives: BaseObjective[],
      pastStudies: PastStudy[],
    ) => {
      const referenceTrajectory = calculateCustomTrajectory({
        studyEmissions: referenceEmissions,
        studyStartYear: referenceYear,
        objectives,
        pastStudies,
        defaultTrajectory: DEFAULT_TRAJECTORY,
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
        defaultTrajectory: DEFAULT_TRAJECTORY,
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
        defaultTrajectory: DEFAULT_TRAJECTORY,
      })

      const currentTrajectory = calculateSBTiTrajectory({
        studyEmissions: currentEmissions,
        studyStartYear: currentYear,
        reductionRate,
        pastStudies,
        defaultTrajectory: DEFAULT_TRAJECTORY,
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

  describe('calculateTrajectoryYearBounds', () => {
    test('when SNBC is enabled, min should be 1990 and max year should be 2060 when last objective of custom trajectory is in 2060', () => {
      const snbcEnabled = true
      const pastStudies: PastStudy[] = []
      const trajectories = [
        {
          id: 'custom-trajectory-1',
          referenceYear: 2020,
          objectives: [
            { id: 'obj-1', targetYear: 2030, reductionRate: 0.05 },
            { id: 'obj-2', targetYear: 2060, reductionRate: 0.08 },
          ],
        },
      ] as TrajectoryWithObjectives[]
      const selectedCustomTrajectoryIds = ['custom-trajectory-1']
      const actions: Action[] = []

      const result = calculateTrajectoryYearBounds(
        snbcEnabled,
        pastStudies,
        trajectories,
        selectedCustomTrajectoryIds,
        actions,
      )

      expect(result.minYear).toBe(1990)
      expect(result.maxYear).toBe(2060)
    })

    test('when there is only SBTI 1.5°C, it should be 2020 to 2050', () => {
      const snbcEnabled = false
      const pastStudies: PastStudy[] = []
      const trajectories: TrajectoryWithObjectives[] = []
      const selectedCustomTrajectoryIds: string[] = []
      const actions: Action[] = []

      const result = calculateTrajectoryYearBounds(
        snbcEnabled,
        pastStudies,
        trajectories,
        selectedCustomTrajectoryIds,
        actions,
      )

      expect(result.minYear).toBe(2020)
      expect(result.maxYear).toBe(TARGET_YEAR)
      expect(result.maxYear).toBe(2050)
    })
  })
})
