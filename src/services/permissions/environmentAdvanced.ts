import { Environment, Level } from '@prisma/client'
import { hasAccessToCarbonResponsibilityIntensities, isTilt } from './environment'

const { BC, CUT, TILT, CLICKSON } = Environment

export const isTiltSimplified = (environment: Environment, simplified?: boolean | null) =>
  isTilt(environment) && simplified

export const hasAccessToEmissionFactors = (environment: Environment, userLevel: Level | null) =>
  ([BC, CLICKSON] as Environment[]).includes(environment) || (environment === TILT && !!userLevel)

export const hasAccessToStudies = (environment: Environment, userLevel: Level | null) =>
  ([BC, CUT, CLICKSON] as Environment[]).includes(environment) || (environment === TILT && !!userLevel)

export const hasAccessToSettings = (environment: Environment, userLevel: Level | null) =>
  ([BC] as Environment[]).includes(environment) || (environment === TILT && !!userLevel)

export const hasAccessToMethodology = (environment: Environment, userLevel: Level | null) =>
  ([BC, CLICKSON] as Environment[]).includes(environment) || (environment === TILT && !!userLevel)

export const hasAccessToCarbonResponsibilityIntensitiesAdvanced = (
  environment: Environment,
  simplified?: boolean | null,
) => !isTiltSimplified(environment, simplified) && hasAccessToCarbonResponsibilityIntensities(environment)
