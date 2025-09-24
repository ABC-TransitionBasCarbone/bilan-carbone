import { Environment } from '@prisma/client'

export const hasAccessToEmissionFactor = (environment: Environment) =>
  ([Environment.BC, Environment.TILT] as Environment[]).includes(environment)

export const hasAccessToSettings = (environment: Environment) =>
  ([Environment.BC, Environment.TILT] as Environment[]).includes(environment)

export const hasAccessToActualityCards = (environment: Environment) => environment === Environment.BC

export const hasAccessToDownloadStudyEmissionSourcesButton = (environment: Environment) =>
  ([Environment.BC, Environment.TILT] as Environment[]).includes(environment)

export const hasAccessToStudyCardDetails = (environment: Environment) =>
  ([Environment.BC, Environment.TILT] as Environment[]).includes(environment)

export const hasAccessToCreateOrganization = (environment: Environment) => environment === Environment.BC

export const hasAccessToDuplicateStudy = (environment: Environment) =>
  ([Environment.BC, Environment.TILT] as Environment[]).includes(environment)

export const hasAccessToCreateEmissionSourceTag = async (environment: Environment) =>
  ([Environment.BC, Environment.TILT] as Environment[]).includes(environment)

export const hasAccessToStudyFlowExample = (environment: Environment) =>
  ([Environment.TILT, Environment.BC] as Environment[]).includes(environment)

export const hasWasteImpact = (environment: Environment) => environment !== Environment.CUT

export const hasAccessToBcExport = (environment: Environment) =>
  ([Environment.TILT] as Environment[]).includes(environment)

export const hasAccessToDependencyMatrix = (environment: Environment) =>
  ([Environment.TILT] as Environment[]).includes(environment)

export const hasAccessToDependencyMatrixExample = (environment: Environment) => false
