/**
 * Shared trajectory calculation utilities for simple linear reduction trajectories.
 * Used by MIP (individual footprint) and potentially other apps.
 * For full SNBC trajectory logic (with sectenData), see apps/bilan-carbone/src/utils/snbc.ts.
 */

/**
 * Yearly proportional reduction rates per segment.
 * Each rate is applied linearly to the value at the start of the segment.
 * Used by both MIP (simple trajectory) and bilan-carbone (full SNBC logic in snbc.ts).
 */
export interface ReductionRates {
    /** Yearly proportional rate from current year to 2015, only for sector-specific SNBC trajectories */
    rateTo2015?: number
    /** Yearly proportional rate from current year to 2030 (applied to current value) */
    rateTo2030: number
    /** Yearly proportional rate from 2030 to 2050 (applied to 2030 value) */
    rateTo2050: number
}

/**
 * Compute the yearly proportional reduction rate for a linear segment between two emission levels.
 * Returns 0 if fromEmissions is non-positive or already below toEmissions.
 * Returns null if the year span is zero or negative.
 */
export const calculateRateForSegment = (
    fromEmissions: number,
    toEmissions: number,
    fromYear: number,
    toYear: number,
): number | null => {
    if (fromEmissions <= 0 || fromEmissions <= toEmissions) {
        return 0
    }
    const years = toYear - fromYear
    if (years <= 0) {
        return null
    }
    return (fromEmissions - toEmissions) / fromEmissions / years
}

export interface TrajectoryPoint {
    year: number
    value: number
}

/** SNBC-inspired defaults: ~40% total reduction by 2030, ~88% by 2050 from current footprint. */
const SNBC_DEFAULT_TOTAL_REDUCTION_2030 = 0.4
const SNBC_DEFAULT_TOTAL_REDUCTION_2050 = 0.88
// value at 2030 = current * (1 - 0.40) = 0.6 * current
// value at 2050 = current * (1 - 0.88) = 0.12 * current
// Reduction in segment 2030–2050 relative to 2030 value: (0.6 - 0.12) / 0.6 = 0.8 over 20 years
const SNBC_DEFAULT_RATE_2030_TO_2050 = 0.8 / 20

/**
 * Compute SNBC-inspired default reduction rates relative to the respondent's current footprint.
 * - Segment 1 (currentYear → 2030): 40% total linear reduction from current value.
 * - Segment 2 (2030 → 2050): 80% linear reduction from the 2030 value (~88% from current).
 */
export const getSnbcDefaultReductionRates = (currentYear: number): ReductionRates => {
    const yearsTo2030 = Math.max(1, 2030 - currentYear)
    return {
        rateTo2030: SNBC_DEFAULT_TOTAL_REDUCTION_2030 / yearsTo2030,
        rateTo2050: SNBC_DEFAULT_RATE_2030_TO_2050,
    }
}

/**
 * Calculate a simple two-segment linear trajectory:
 * - Segment 1: currentYear → 2030 using rateTo2030 (yearly, applied to current value)
 * - Segment 2: 2030 → 2050 using rateTo2050 (yearly, applied to 2030 value)
 *
 * Returns one data point per requested checkpoint (plus the current year).
 */
export const calculateSimpleLinearTrajectory = (
    currentValue: number,
    currentYear: number,
    rates: ReductionRates,
    checkpoints: number[] = [2030, 2040, 2050],
): TrajectoryPoint[] => {
    const yearlyReductionTo2030 = currentValue * rates.rateTo2030
    const value2030 = Math.max(0, currentValue - yearlyReductionTo2030 * Math.max(0, 2030 - currentYear))
    const yearlyReductionTo2050 = value2030 * rates.rateTo2050

    const getValue = (year: number): number => {
        if (year <= currentYear) return currentValue
        if (year <= 2030) {
            return Math.max(0, currentValue - yearlyReductionTo2030 * (year - currentYear))
        }
        return Math.max(0, value2030 - yearlyReductionTo2050 * (year - 2030))
    }

    const years = [currentYear, ...checkpoints.filter((y) => y > currentYear)]
    return [...new Set(years)]
        .sort((a, b) => a - b)
        .map((year) => ({ year, value: getValue(year) }))
}
