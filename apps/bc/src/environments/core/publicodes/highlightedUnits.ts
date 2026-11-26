import { TILT_HIGHLIGHTED_UNITS } from '@/environments/tilt/publicodes/highlightedUnits'
import { Environment } from '@abc-transitionbascarbone/common/db/enums'
import { getEnvironmentHandlingGenericEnvs } from '@abc-transitionbascarbone/common/utils/environments'

const HIGHLIGHTED_UNITS_FROM_ENV: Partial<Record<Environment, readonly string[]>> = {
  [Environment.TILT]: TILT_HIGHLIGHTED_UNITS,
}

const NO_HIGHLIGHTED_UNITS: readonly string[] = []

// COURSE_TILT falls back to TILT, so the Tilt course environment gets the same highlighted units
export const getHighlightedUnits = (environment: Environment): readonly string[] =>
  HIGHLIGHTED_UNITS_FROM_ENV[getEnvironmentHandlingGenericEnvs(environment)] ?? NO_HIGHLIGHTED_UNITS
