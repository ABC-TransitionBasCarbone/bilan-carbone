import {
  SNBC_SECTOR_TARGET_EMISSIONS,
  TRAJECTORY_SNBC_ENERGY_ID,
  TRAJECTORY_SNBC_GENERAL_ID,
  TRAJECTORY_SNBC_TRANSPORTATION_ID,
} from '@/constants/trajectory.constants'
import type { PastStudy, TrajectoryDataPoint } from '@/types/trajectory.types'
import { expect } from '@jest/globals'
import { createGeneralSectenData, createSectenDataWithSectors } from './secten.test-utils'
import {
  calculateCustomSNBCSectoralTrajectory,
  calculateSNBCTrajectory,
  calculateSectoralSNBCReductionRates,
  getSNBCData,
} from './snbc'
import { calculateTrajectoryIntegral } from './trajectory-shared.utils'

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

const STANDARD_STUDY_EMISSIONS = 1000
const EXPECTED_2030_VALUE_FOR_STUDY_2025 = 907.86

const createPastStudy = (year: number, totalCo2: number): PastStudy => ({
  id: `past-study-${year}`,
  name: `Study ${year}`,
  type: 'linked',
  year,
  totalCo2,
})

const getValue = (trajectory: TrajectoryDataPoint[], year: number) => {
  return trajectory.find((p) => p.year === year)?.value
}

describe('SNBC Trajectory', () => {
  describe('getSNBCData - without past studies', () => {
    test('study in 2020: rate based on Secten 2020 emissions, objectives reached', () => {
      const sectenData = createGeneralSectenData()
      const studyEmissions = 1000
      const studyStartYear = 2020

      const result = getSNBCData(
        [TRAJECTORY_SNBC_GENERAL_ID],
        sectenData,
        null,
        [],
        studyStartYear,
        studyEmissions,
        2050,
      )
      const trajectory = result![TRAJECTORY_SNBC_GENERAL_ID]!.currentTrajectory

      // Expected values calculated based on previous secten data
      expect(getValue(trajectory, 1990)).toBeCloseTo(1381.31, 0)
      expect(getValue(trajectory, 2017)).toBeCloseTo(1174.24, 0)
      expect(getValue(trajectory, 2018)).toBeCloseTo(1126.26, 0)
      expect(getValue(trajectory, 2019)).toBeCloseTo(1101.01, 0)
      expect(getValue(trajectory, 2020)).toBe(studyEmissions)

      // Expected values calculated based on SNBC objectives
      expect(getValue(trajectory, 2030)).toBeCloseTo(828.78, 0)
      expect(getValue(trajectory, 2050)).toBeCloseTo(230.22, 0)
    })

    test('study in 2025 (after last Secten): rate based on Secten 2024, reconstruction uses rateTo2030', () => {
      const sectenData = createGeneralSectenData()
      const studyEmissions = STANDARD_STUDY_EMISSIONS
      const studyStartYear = 2025

      const result = getSNBCData(
        [TRAJECTORY_SNBC_GENERAL_ID],
        sectenData,
        null,
        [],
        studyStartYear,
        studyEmissions,
        2050,
      )

      const trajectory = result![TRAJECTORY_SNBC_GENERAL_ID]!.currentTrajectory

      // Expected values for reconstruction and forward trajectory
      expect(trajectory.find((p) => p.year === 2025)?.value).toBe(studyEmissions)
      expect(trajectory.find((p) => p.year === 1990)?.value).toBeCloseTo(1510.22, 0)
      expect(trajectory.find((p) => p.year === 2024)?.value).toBeCloseTo(1018.77, 0)
      expect(trajectory.find((p) => p.year === 2030)?.value).toBeCloseTo(EXPECTED_2030_VALUE_FOR_STUDY_2025, 0)
      expect(trajectory.find((p) => p.year === 2050)?.value).toBeCloseTo(252.18, 0)
    })

    test('study in 2025 via calculateCustomTrajectory with SNBC_GENERAL type', () => {
      const sectenData = createGeneralSectenData()
      const studyEmissions = STANDARD_STUDY_EMISSIONS
      const studyStartYear = 2025

      const result = getSNBCData(
        [TRAJECTORY_SNBC_GENERAL_ID],
        sectenData,
        null,
        [],
        studyStartYear,
        studyEmissions,
        2050,
      )
      const trajectory = result![TRAJECTORY_SNBC_GENERAL_ID]!.currentTrajectory

      expect(getValue(trajectory, 2025)).toBe(studyEmissions)
      expect(getValue(trajectory, 1990)).toBeCloseTo(1510.22, 0)
      expect(getValue(trajectory, 2024)).toBeCloseTo(1018.77, 0)
      expect(getValue(trajectory, 2030)).toBeCloseTo(EXPECTED_2030_VALUE_FOR_STUDY_2025, 0)
      expect(getValue(trajectory, 2050)).toBeCloseTo(252.18, 0)
    })
  })

  describe('getSNBCData - with past studies (no overshoot)', () => {
    test('past study in 2020, current study in 2024: linear interpolation, Secten reconstruction before 2020', () => {
      const sectenData = createGeneralSectenData()
      const studyEmissions = 900
      const studyStartYear = 2024
      const pastStudies = [createPastStudy(2020, STANDARD_STUDY_EMISSIONS)]

      const result = getSNBCData(
        [TRAJECTORY_SNBC_GENERAL_ID],
        sectenData,
        null,
        pastStudies,
        studyStartYear,
        studyEmissions,
        2050,
      )
      const trajectory = result![TRAJECTORY_SNBC_GENERAL_ID]!.currentTrajectory

      expect(trajectory.find((p) => p.year === 1990)?.value).toBeCloseTo(1381.31, 0)
      expect(trajectory.find((p) => p.year === 2010)?.value).toBeCloseTo(1295.45, 0)
      expect(trajectory.find((p) => p.year === 2020)?.value).toBe(STANDARD_STUDY_EMISSIONS)
      expect(trajectory.find((p) => p.year === 2022)?.value).toBeCloseTo(950, 0)

      expect(trajectory.find((p) => p.year === 2024)?.value).toBe(studyEmissions)
    })

    test('past study in 2022, current study in 2025: linear interpolation, correct rate after 2025', () => {
      const sectenData = createGeneralSectenData()
      const studyEmissions = STANDARD_STUDY_EMISSIONS
      const studyStartYear = 2025
      const pastStudies = [createPastStudy(2022, STANDARD_STUDY_EMISSIONS + 60)]

      const result = getSNBCData(
        [TRAJECTORY_SNBC_GENERAL_ID],
        sectenData,
        null,
        pastStudies,
        studyStartYear,
        studyEmissions,
        2050,
      )
      const trajectory = result![TRAJECTORY_SNBC_GENERAL_ID]!.currentTrajectory

      expect(trajectory.find((p) => p.year === 2022)?.value).toBe(STANDARD_STUDY_EMISSIONS + 60)
      expect(trajectory.find((p) => p.year === 2023)?.value).toBeCloseTo(STANDARD_STUDY_EMISSIONS + 40, 0)
      expect(trajectory.find((p) => p.year === 2024)?.value).toBeCloseTo(STANDARD_STUDY_EMISSIONS + 20, 0)
      expect(trajectory.find((p) => p.year === 2025)?.value).toBe(studyEmissions)
      expect(trajectory.find((p) => p.year === 2030)?.value).toBeCloseTo(EXPECTED_2030_VALUE_FOR_STUDY_2025, 0)
    })

    test('multiple past studies (2018, 2021), current study in 2024: interpolation between all points, Secten reconstruction before 2018', () => {
      const sectenData = createGeneralSectenData()
      const studyEmissions = 800
      const studyStartYear = 2024
      const pastStudies = [createPastStudy(2018, 1200), createPastStudy(2021, STANDARD_STUDY_EMISSIONS)]

      const result = getSNBCData(
        [TRAJECTORY_SNBC_GENERAL_ID],
        sectenData,
        null,
        pastStudies,
        studyStartYear,
        studyEmissions,
        2050,
      )

      const trajectory = result![TRAJECTORY_SNBC_GENERAL_ID]!.currentTrajectory

      // Past study points
      expect(trajectory.find((p) => p.year === 2018)?.value).toBe(1200)
      expect(trajectory.find((p) => p.year === 2021)?.value).toBe(STANDARD_STUDY_EMISSIONS)
      expect(trajectory.find((p) => p.year === 2024)?.value).toBe(studyEmissions)
      expect(trajectory.find((p) => p.year === 2019)?.value).toBeCloseTo(1133, 0)
      expect(trajectory.find((p) => p.year === 2022)?.value).toBeCloseTo(933, 0)
      expect(trajectory.find((p) => p.year === 1990)?.value).toBeCloseTo(1471.75, 0)
      expect(trajectory.find((p) => p.year === 2010)?.value).toBeCloseTo(1380.27, 0)
    })
  })

  describe('SNBC - budget equality test with overshoot compensation', () => {
    test('overshoot compensation ensures equal total budget', () => {
      const sectenData = createGeneralSectenData()
      const referenceStudy = createPastStudy(2022, STANDARD_STUDY_EMISSIONS)
      const studyStartYear = 2025
      const studyEmissions = 1200

      const result = getSNBCData(
        [TRAJECTORY_SNBC_GENERAL_ID],
        sectenData,
        referenceStudy,
        [],
        studyStartYear,
        studyEmissions,
        2050,
      )

      expect(result![TRAJECTORY_SNBC_GENERAL_ID]!.withinThreshold).toBe(false)
      expect(result![TRAJECTORY_SNBC_GENERAL_ID]!.previousTrajectory).not.toBeNull()

      const referenceTrajectory = result![TRAJECTORY_SNBC_GENERAL_ID]!.previousTrajectory!
      const currentTrajectory = result![TRAJECTORY_SNBC_GENERAL_ID]!.currentTrajectory

      const referenceBudget = calculateTrajectoryIntegral(referenceTrajectory, 2022, 2050)
      const currentBudget = calculateTrajectoryIntegral(currentTrajectory, 2022, 2050)

      const budgetDifference = Math.abs(currentBudget - referenceBudget)
      const relativeDifference = budgetDifference / referenceBudget

      expect(relativeDifference).toBeLessThan(1)
    })

    test('multiple overshoot scenarios maintain budget equality', () => {
      const sectenData = createGeneralSectenData()
      const referenceStudy = createPastStudy(2022, STANDARD_STUDY_EMISSIONS)

      const testCases = [
        { year: 2025, emissions: 1100 },
        { year: 2025, emissions: 1200 },
        { year: 2024, emissions: 1100 },
      ]

      testCases.forEach(({ year, emissions }) => {
        const result = getSNBCData([TRAJECTORY_SNBC_GENERAL_ID], sectenData, referenceStudy, [], year, emissions, 2050)

        if (result![TRAJECTORY_SNBC_GENERAL_ID]!.withinThreshold) {
          return
        }

        const referenceTrajectory = result![TRAJECTORY_SNBC_GENERAL_ID]!.previousTrajectory!
        const currentTrajectory = result![TRAJECTORY_SNBC_GENERAL_ID]!.currentTrajectory

        const referenceBudget = calculateTrajectoryIntegral(referenceTrajectory, 2022, 2050)
        const currentBudget = calculateTrajectoryIntegral(currentTrajectory, 2022, 2050)

        const relativeDifference = Math.abs(currentBudget - referenceBudget) / referenceBudget

        expect(relativeDifference).toBeLessThan(1)
      })
    })
  })

  describe('calculateCustomSNBCSectoralTrajectory - basic', () => {
    test('100% energy sector matches pure energy trajectory scaled to study emissions', () => {
      const sectenData = createSectenDataWithSectors()
      const studyEmissions = STANDARD_STUDY_EMISSIONS
      const studyStartYear = 2020

      const sectorPercentages = { energy: 100, industry: 0, waste: 0, buildings: 0, agriculture: 0, transportation: 0 }
      const combined = calculateCustomSNBCSectoralTrajectory(
        { studyEmissions, studyStartYear, sectenData, pastStudies: [] },
        sectorPercentages,
      )

      const pureEnergy = calculateSNBCTrajectory(
        { studyEmissions, studyStartYear, sectenData, pastStudies: [] },
        'energy',
      )

      expect(combined.find((p) => p.year === 2030)?.value).toBeCloseTo(
        pureEnergy.find((p) => p.year === 2030)!.value,
        0,
      )
      expect(combined.find((p) => p.year === 2050)?.value).toBeCloseTo(
        pureEnergy.find((p) => p.year === 2050)!.value,
        0,
      )
    })

    test('sum of weighted sub-trajectories equals combined trajectory at every year', () => {
      const sectenData = createSectenDataWithSectors()
      const studyEmissions = STANDARD_STUDY_EMISSIONS
      const studyStartYear = 2020
      const sectorPercentages = { energy: 30, industry: 0, waste: 0, buildings: 0, agriculture: 0, transportation: 40 }
      const generalPercentage = 30

      const combined = calculateCustomSNBCSectoralTrajectory(
        { studyEmissions, studyStartYear, sectenData, pastStudies: [] },
        sectorPercentages,
      )

      const energyTrajectory = calculateSNBCTrajectory(
        { studyEmissions: studyEmissions * 0.3, studyStartYear, sectenData, pastStudies: [] },
        'energy',
      )
      const transportTrajectory = calculateSNBCTrajectory(
        { studyEmissions: studyEmissions * 0.4, studyStartYear, sectenData, pastStudies: [] },
        'transportation',
      )
      const generalTrajectory = calculateSNBCTrajectory({
        studyEmissions: studyEmissions * (generalPercentage / 100),
        studyStartYear,
        sectenData,
        pastStudies: [],
      })

      for (const year of [2020, 2025, 2030, 2040, 2050]) {
        const expectedSum =
          (energyTrajectory.find((p) => p.year === year)?.value ?? 0) +
          (transportTrajectory.find((p) => p.year === year)?.value ?? 0) +
          (generalTrajectory.find((p) => p.year === year)?.value ?? 0)
        expect(combined.find((p) => p.year === year)?.value).toBeCloseTo(expectedSum, 0)
      }
    })
  })

  describe('calculateCustomSNBCSectoralTrajectory - budget equality with overshoot', () => {
    const expectBudgetsEqual = (actual: number, expected: number) => {
      const relativeDifference = Math.abs(actual - expected) / expected
      expect(relativeDifference).toBeLessThan(0.05) // 5% max
    }

    const testSNBCSectoralBudgetEquality = (
      referenceYear: number,
      currentYear: number,
      referenceEmissions: number,
      currentEmissions: number,
      sectorPercentages: {
        energy: number
        industry: number
        waste: number
        buildings: number
        agriculture: number
        transportation: number
      },
      sectenData: ReturnType<typeof createSectenDataWithSectors>,
      pastStudies: PastStudy[],
    ) => {
      const referenceTrajectory = calculateCustomSNBCSectoralTrajectory(
        {
          studyEmissions: referenceEmissions,
          studyStartYear: referenceYear,
          sectenData,
          pastStudies: pastStudies.filter((s) => s.year < referenceYear),
        },
        sectorPercentages,
      )

      const currentTrajectory = calculateCustomSNBCSectoralTrajectory(
        {
          studyEmissions: currentEmissions,
          studyStartYear: currentYear,
          sectenData,
          pastStudies,
          overshootAdjustment: { referenceTrajectory, referenceStudyYear: referenceYear },
        },
        sectorPercentages,
      )

      const referenceBudget = calculateTrajectoryIntegral(referenceTrajectory, referenceYear, 2050)
      const currentBudget = calculateTrajectoryIntegral(currentTrajectory, referenceYear, 2050)

      expectBudgetsEqual(currentBudget, referenceBudget)
    }

    test('100% general — current budget stays within range of reference across gap sizes', () => {
      const sectenData = createGeneralSectenData()
      const sectorPercentages = { energy: 0, industry: 0, waste: 0, buildings: 0, agriculture: 0, transportation: 0 }

      testSNBCSectoralBudgetEquality(2022, 2023, 1000, 1200, sectorPercentages, sectenData, [
        createPastStudy(2022, 1000),
      ])
      testSNBCSectoralBudgetEquality(2015, 2025, 1000, 1200, sectorPercentages, sectenData, [
        createPastStudy(2015, 1000),
      ])
      testSNBCSectoralBudgetEquality(2026, 2027, 1000, 1200, sectorPercentages, sectenData, [
        createPastStudy(2026, 1000),
      ])
    })

    test('partial sectors (40% general) — current budget stays within range for varying overshoot magnitudes', () => {
      const sectenData = createGeneralSectenData()
      const sectorPercentages = { energy: 30, industry: 0, waste: 0, buildings: 0, agriculture: 0, transportation: 30 }

      testSNBCSectoralBudgetEquality(2022, 2025, 1000, 1100, sectorPercentages, sectenData, [
        createPastStudy(2022, 1000),
      ])
      testSNBCSectoralBudgetEquality(2015, 2025, 1000, 1200, sectorPercentages, sectenData, [
        createPastStudy(2015, 1000),
      ])
      testSNBCSectoralBudgetEquality(2026, 2027, 1000, 1500, sectorPercentages, sectenData, [
        createPastStudy(2026, 1000),
      ])
    })

    test('partial sectors with multiple past studies — current budget stays within range', () => {
      const sectenData = createGeneralSectenData()
      const sectorPercentages = { energy: 20, industry: 0, waste: 0, buildings: 0, agriculture: 0, transportation: 10 }

      testSNBCSectoralBudgetEquality(2022, 2025, 1000, 1300, sectorPercentages, sectenData, [
        createPastStudy(2015, 1100),
        createPastStudy(2022, 1000),
      ])
      testSNBCSectoralBudgetEquality(2023, 2025, 1000, 1200, sectorPercentages, sectenData, [
        createPastStudy(2021, 1150),
        createPastStudy(2023, 1000),
      ])
    })
  })

  describe('calculateSectoralSNBCReductionRates', () => {
    test('returns rates consistent with the combined trajectory values at 2030 and 2050', () => {
      const sectenData = createSectenDataWithSectors()
      const studyEmissions = STANDARD_STUDY_EMISSIONS
      const studyStartYear = 2020
      const sectorPercentages = { energy: 30, industry: 0, waste: 0, buildings: 0, agriculture: 0, transportation: 40 }

      const params = { studyEmissions, studyStartYear, sectenData, pastStudies: [] }
      const rates = calculateSectoralSNBCReductionRates(params, sectorPercentages)
      const trajectory = calculateCustomSNBCSectoralTrajectory(params, sectorPercentages)

      expect(rates).not.toBeNull()

      const baseline = trajectory.find((p) => p.year === studyStartYear)!.value
      const value2030 = trajectory.find((p) => p.year === 2030)!.value
      const value2050 = trajectory.find((p) => p.year === 2050)!.value

      const expectedRate2030 = (baseline - value2030) / baseline / (2030 - studyStartYear)
      const expectedRate2050 = (value2030 - value2050) / value2030 / (2050 - 2030)

      expect(rates!.rateTo2030).toBeCloseTo(expectedRate2030)
      expect(rates!.rateTo2050).toBeCloseTo(expectedRate2050)
    })

    test('returns rateTo2015 when studyStartYear is before 2015', () => {
      const sectenData = createSectenDataWithSectors()
      const studyStartYear = 2010
      const params = {
        studyEmissions: STANDARD_STUDY_EMISSIONS,
        studyStartYear,
        sectenData,
        pastStudies: [],
      }
      const sectorPercentages = { energy: 50, industry: 0, waste: 0, buildings: 0, agriculture: 0, transportation: 50 }

      const rates = calculateSectoralSNBCReductionRates(params, sectorPercentages)

      expect(rates).not.toBeNull()
      expect(rates!.rateTo2015).toBeDefined()
      expect(rates!.rateTo2015).toBeGreaterThan(0)
    })
  })

  describe('getSNBCData - with sectoral IDs', () => {
    test('energy sector ID produces a non-empty trajectory', () => {
      const sectenData = createSectenDataWithSectors()
      const result = getSNBCData(['energy'], sectenData, null, [], 2020, STANDARD_STUDY_EMISSIONS, 2050)

      expect(result['energy']).not.toBeNull()
      expect(result['energy']!.currentTrajectory.length).toBeGreaterThan(0)
    })

    test('transportation sector ID trajectory respects 2030 and 2050 targets direction', () => {
      const sectenData = createSectenDataWithSectors()
      const result = getSNBCData(['transportation'], sectenData, null, [], 2020, STANDARD_STUDY_EMISSIONS, 2050)

      const trajectory = result['transportation']!.currentTrajectory
      const value2020 = trajectory.find((p) => p.year === 2020)?.value ?? 0
      const value2030 = trajectory.find((p) => p.year === 2030)?.value ?? 0
      const value2050 = trajectory.find((p) => p.year === 2050)?.value ?? 0

      expect(value2030).toBeLessThan(value2020)
      expect(value2050).toBeLessThan(value2030)
    })

    test('multiple sector IDs returned in single call', () => {
      const sectenData = createSectenDataWithSectors()
      const result = getSNBCData(
        ['energy', 'transportation', TRAJECTORY_SNBC_GENERAL_ID],
        sectenData,
        null,
        [],
        2020,
        STANDARD_STUDY_EMISSIONS,
        2050,
      )

      expect(Object.keys(result)).toHaveLength(3)
      expect(result['energy']!.currentTrajectory.length).toBeGreaterThan(0)
      expect(result['transportation']!.currentTrajectory.length).toBeGreaterThan(0)
      expect(result[TRAJECTORY_SNBC_GENERAL_ID]!.currentTrajectory.length).toBeGreaterThan(0)
    })
  })

  describe('SNBC Sectoral Trajectories', () => {
    test('energy sector trajectory has 2015 as intermediate target year', () => {
      const sectenData = createSectenDataWithSectors()
      const studyEmissions = STANDARD_STUDY_EMISSIONS
      const studyStartYear = 2010
      const energyTargetEmissions = SNBC_SECTOR_TARGET_EMISSIONS[TRAJECTORY_SNBC_ENERGY_ID]

      const secten2010 = sectenData.find((s) => s.year === 2010)
      if (!secten2010) {
        throw new Error('Secten 2010 not found')
      }

      const expectedEnergyReductionRates = {
        rateTo2015: (secten2010.energy - energyTargetEmissions[2015]) / secten2010.energy / (2015 - 2010),
        rateTo2030:
          (energyTargetEmissions[2015] - energyTargetEmissions[2030]) / energyTargetEmissions[2015] / (2030 - 2015),
        rateTo2050:
          (energyTargetEmissions[2030] - energyTargetEmissions[2050]) / energyTargetEmissions[2030] / (2050 - 2030),
      }

      const yearlyReduction2015 = studyEmissions * expectedEnergyReductionRates.rateTo2015
      const expectedValue2015 = studyEmissions - yearlyReduction2015 * (2015 - 2010)

      const yearlyReduction2030 = expectedValue2015 * expectedEnergyReductionRates.rateTo2030
      const expectedValue2030 = expectedValue2015 - yearlyReduction2030 * (2030 - 2015)

      const yearlyReduction2050 = expectedValue2030 * expectedEnergyReductionRates.rateTo2050
      const expectedValue2050 = expectedValue2030 - yearlyReduction2050 * (2050 - 2030)

      const trajectory = calculateSNBCTrajectory(
        {
          studyEmissions,
          studyStartYear,
          sectenData,
          pastStudies: [],
          displayCurrentStudyValueOnTrajectory: true,
        },
        'energy',
      )

      expect(trajectory.length).toBeGreaterThan(0)
      const value2015 = getValue(trajectory, 2015)
      const value2030 = getValue(trajectory, 2030)
      const value2050 = getValue(trajectory, 2050)

      expect(value2015).toBeCloseTo(expectedValue2015, 0)
      expect(value2030).toBeCloseTo(expectedValue2030, 0)
      expect(value2050).toBeCloseTo(expectedValue2050, 0)
    })

    test('transportation sector after 2015 applies proper sector reduction rates', () => {
      const sectenData = createSectenDataWithSectors()
      const studyEmissions = STANDARD_STUDY_EMISSIONS
      const studyStartYear = 2020
      const transportationTargetEmissions = SNBC_SECTOR_TARGET_EMISSIONS[TRAJECTORY_SNBC_TRANSPORTATION_ID]

      const expectedTransportationReductionRates = {
        rateTo2030:
          (transportationTargetEmissions[2015] - transportationTargetEmissions[2030]) /
          transportationTargetEmissions[2015] /
          (2030 - 2015),
        rateTo2050:
          (transportationTargetEmissions[2030] - transportationTargetEmissions[2050]) /
          transportationTargetEmissions[2030] /
          (2050 - 2030),
      }

      const yearlyReduction2030 = studyEmissions * expectedTransportationReductionRates.rateTo2030
      const expectedValue2030 = studyEmissions - yearlyReduction2030 * (2030 - 2020)

      const yearlyReduction2050 = expectedValue2030 * expectedTransportationReductionRates.rateTo2050
      const expectedValue2050 = expectedValue2030 - yearlyReduction2050 * (2050 - 2030)

      const trajectory = calculateSNBCTrajectory(
        {
          studyEmissions,
          studyStartYear,
          sectenData,
          pastStudies: [],
          displayCurrentStudyValueOnTrajectory: true,
        },
        'transportation',
      )

      expect(trajectory.length).toBeGreaterThan(0)
      const value2020 = getValue(trajectory, 2020)
      const value2030 = getValue(trajectory, 2030)
      const value2050 = getValue(trajectory, 2050)

      expect(value2020).toBe(studyEmissions)
      expect(value2030).toBeCloseTo(expectedValue2030, 0)
      expect(value2050).toBeCloseTo(expectedValue2050, 0)
    })
  })
})
