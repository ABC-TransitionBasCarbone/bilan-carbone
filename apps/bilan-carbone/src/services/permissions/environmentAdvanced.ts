import { Environment, Level } from '@abc-transitionbascarbone/db-common/enums'
import { mappedTiltSituationToCustomDataFields } from '../customDataToSituation'
import { hasAccessToCarbonResponsibilityIntensities, hasAccessToStudyHomePage, isTilt } from './environment'

const { BC, CUT, TILT, CLICKSON } = Environment

export const isTiltSimplified = (environment: Environment, simplified?: boolean | null) =>
  isTilt(environment) && simplified

export const isAdvancedAndNotTiltSimplified = (environment: Environment, simplified?: boolean | null) =>
  ([BC, TILT] as Environment[]).includes(environment) && !isTiltSimplified(environment, simplified)

export const hasAccessToEmissionFactors = (environment: Environment, userLevel: Level | null) =>
  ([BC, CLICKSON] as Environment[]).includes(environment) || (environment === TILT && !!userLevel)

export const hasAccessToStudies = (environment: Environment, userLevel: Level | null) =>
  ([BC, CUT, CLICKSON] as Environment[]).includes(environment) || (environment === TILT && !!userLevel)

export const hasAccessToSettings = (environment: Environment, userLevel: Level | null) =>
  ([BC] as Environment[]).includes(environment) || (environment === TILT && !!userLevel)

export const hasAccessToMethodology = (environment: Environment, userLevel: Level | null) =>
  ([BC] as Environment[]).includes(environment) || (environment === TILT && !!userLevel)

export const hasAccessToCarbonResponsibilityIntensitiesAdvanced = (
  environment: Environment,
  simplified?: boolean | null,
) => !isTiltSimplified(environment, simplified) && hasAccessToCarbonResponsibilityIntensities(environment)

export const hasAccessToEngagementActions = isAdvancedAndNotTiltSimplified

export const hasAccessToPerimeterPage = isAdvancedAndNotTiltSimplified

export const hasAccessToDuplicateStudy = isAdvancedAndNotTiltSimplified

export const hasCompletedTiltSimplifiedGeneralData = (situation?: Record<string, unknown> | null) => {
  if (!situation) {
    return false
  }

  const mappedKeys = Object.keys(mappedTiltSituationToCustomDataFields)
  return mappedKeys.every((key) => {
    const value = situation[key]
    if (typeof value === 'string') {
      return value.trim() !== ''
    }
    return value !== undefined && value !== null
  })
}

export const getStudyDefaultLandingPath = (
  environment: Environment,
  studyId: string,
  simplified?: boolean | null,
  isTiltSimplifiedGeneralDataCompleted: boolean = false,
) => {
  if (!hasAccessToStudyHomePage(environment)) {
    return `/etudes/${studyId}/cadrage`
  }

  if (isTiltSimplified(environment, simplified)) {
    return isTiltSimplifiedGeneralDataCompleted
      ? `/etudes/${studyId}/comptabilisation/saisie-des-donnees`
      : `/etudes/${studyId}/cadrage`
  }

  return `/etudes/${studyId}/comptabilisation/saisie-des-donnees`
}
