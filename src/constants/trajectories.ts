import { SectenSector } from '@/utils/snbc'

// Trajectory type constants
export const TRAJECTORY_15_ID = '1,5'
export const TRAJECTORY_WB2C_ID = 'WB2C'
export const TRAJECTORY_SNBC_GENERAL_ID = 'SNBC_GENERAL'
export const TRAJECTORY_SNBC_SECTORAL_ID = 'SNBC_SECTORAL'
export const TRAJECTORY_SNBC_ENERGY_ID = 'SNBC_ENERGY'
export const TRAJECTORY_SNBC_INDUSTRY_ID = 'SNBC_INDUSTRY'
export const TRAJECTORY_SNBC_WASTE_ID = 'SNBC_WASTE'
export const TRAJECTORY_SNBC_BUILDINGS_ID = 'SNBC_BUILDINGS'
export const TRAJECTORY_SNBC_AGRICULTURE_ID = 'SNBC_AGRICULTURE'
export const TRAJECTORY_SNBC_TRANSPORTATION_ID = 'SNBC_TRANSPORTATION'

export const SNBC_SECTOR_COLORS: Record<string, string> = {
  [TRAJECTORY_SNBC_GENERAL_ID]: 'var(--trajectory-snbc)',
  [TRAJECTORY_SNBC_ENERGY_ID]: 'var(--trajectory-snbc-energy)',
  [TRAJECTORY_SNBC_INDUSTRY_ID]: 'var(--trajectory-snbc-industry)',
  [TRAJECTORY_SNBC_WASTE_ID]: 'var(--trajectory-snbc-waste)',
  [TRAJECTORY_SNBC_BUILDINGS_ID]: 'var(--trajectory-snbc-buildings)',
  [TRAJECTORY_SNBC_AGRICULTURE_ID]: 'var(--trajectory-snbc-agriculture)',
  [TRAJECTORY_SNBC_TRANSPORTATION_ID]: 'var(--trajectory-snbc-transportation)',
}

export const SNBC_SECTOR_MAP: Record<string, SectenSector> = {
  [TRAJECTORY_SNBC_ENERGY_ID]: 'energy',
  [TRAJECTORY_SNBC_INDUSTRY_ID]: 'industry',
  [TRAJECTORY_SNBC_WASTE_ID]: 'waste',
  [TRAJECTORY_SNBC_BUILDINGS_ID]: 'buildings',
  [TRAJECTORY_SNBC_AGRICULTURE_ID]: 'agriculture',
  [TRAJECTORY_SNBC_TRANSPORTATION_ID]: 'transportation',
}
