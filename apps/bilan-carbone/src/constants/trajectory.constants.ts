export const SECTEN_SECTORS = ['energy', 'industry', 'waste', 'buildings', 'agriculture', 'transportation'] as const
export type SectenSector = (typeof SECTEN_SECTORS)[number]

// Trajectory type constants
export const TRAJECTORY_15_ID = '1,5'
export const TRAJECTORY_WB2C_ID = 'WB2C'
export const TRAJECTORY_SNBC_GENERAL_ID = 'general'
export const TRAJECTORY_SNBC_ENERGY_ID = 'energy'
export const TRAJECTORY_SNBC_INDUSTRY_ID = 'industry'
export const TRAJECTORY_SNBC_WASTE_ID = 'waste'
export const TRAJECTORY_SNBC_BUILDINGS_ID = 'buildings'
export const TRAJECTORY_SNBC_AGRICULTURE_ID = 'agriculture'
export const TRAJECTORY_SNBC_TRANSPORTATION_ID = 'transportation'

export const SNBC_SECTOR_TARGET_EMISSIONS: Record<SectenSector, { 2015: number; 2030: number; 2050: number }> = {
  [TRAJECTORY_SNBC_ENERGY_ID]: { 2015: 50000, 2030: 31000, 2050: 2000 },
  [TRAJECTORY_SNBC_INDUSTRY_ID]: { 2015: 85000, 2030: 53000, 2050: 16000 },
  [TRAJECTORY_SNBC_WASTE_ID]: { 2015: 15000, 2030: 11000, 2050: 6000 },
  [TRAJECTORY_SNBC_BUILDINGS_ID]: { 2015: 85000, 2030: 45000, 2050: 5000 },
  [TRAJECTORY_SNBC_AGRICULTURE_ID]: { 2015: 87000, 2030: 73000, 2050: 48000 },
  [TRAJECTORY_SNBC_TRANSPORTATION_ID]: { 2015: 138000, 2030: 99000, 2050: 4000 },
}
export const SBTI_REDUCTION_RATE_15 = 0.042
export const SBTI_REDUCTION_RATE_WB2C = 0.025
export const SBTI_START_YEAR = 2020
export const MID_TARGET_YEAR = 2030
export const TARGET_YEAR = 2050
export const OVERSHOOT_THRESHOLD = 0.05
export const SNBC_REFERENCE_YEAR = 1990
export const SNBC_FINAL_TARGET_YEAR = 2050
