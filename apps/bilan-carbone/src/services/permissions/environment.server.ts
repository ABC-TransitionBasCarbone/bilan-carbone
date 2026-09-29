import { isFeatureActiveForEnvironment } from '@/db/deactivableFeatures'
import { DeactivatableFeature, Environment } from '@abc-transitionbascarbone/db-common/enums'
import { isTilt } from './environment'

export const isTiltSimplifiedFeatureActive = async (environment: Environment) => {
  if (!isTilt(environment)) {
    return true
  }

  return isFeatureActiveForEnvironment(DeactivatableFeature.TiltSimplified, environment)
}
