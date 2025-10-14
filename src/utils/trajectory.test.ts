import { expect } from '@jest/globals'
import { calculateTrajectory, SBTI_REDUCTION_RATE_15, SBTI_REDUCTION_RATE_WB2C } from './trajectory'

describe('calculateTrajectory', () => {
  describe('basic trajectory calculation before 2021', () => {
    test('should calculate trajectory from 2020 to 2050 with 1.5°C trajectory', () => {
      const result = calculateTrajectory({
        baseEmissions: 1000,
        studyStartYear: 2020,
        reductionRate: SBTI_REDUCTION_RATE_15,
      })

      expect(result).toHaveLength(31)
      expect(result[0]).toEqual({ year: 2020, value: 1000 })
      expect(result[30].year).toBe(2050)
      expect(Math.round(result[30].value)).toBe(276)
    })

    test('should calculate trajectory with 2°C trajectory', () => {
      const result = calculateTrajectory({
        baseEmissions: 1000,
        studyStartYear: 2020,
        reductionRate: SBTI_REDUCTION_RATE_WB2C,
      })

      expect(result).toHaveLength(31)
      expect(result[0]).toEqual({ year: 2020, value: 1000 })
      expect(result[30].year).toBe(2050)
      expect(Math.round(result[30].value)).toBe(468)
    })

    test('should start graph from study year and keep emissions flat until 2020', () => {
      const result = calculateTrajectory({
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
})
