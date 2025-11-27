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

export const hasAccessToCreateOrganization = (environment: Environment) =>
  ([Environment.TILT, Environment.BC] as Environment[]).includes(environment)

export const hasAccessToDuplicateStudy = (environment: Environment) =>
  ([Environment.BC, Environment.TILT] as Environment[]).includes(environment)

export const hasAccessToCreateStudyTag = async (environment: Environment) =>
  ([Environment.BC, Environment.TILT] as Environment[]).includes(environment)

export const hasAccessToStudyFlowExample = (environment: Environment) =>
  ([Environment.TILT, Environment.BC] as Environment[]).includes(environment)

export const hasWasteImpact = (environment: Environment) => environment !== Environment.CUT

export const hasAccessToBcExport = (environment: Environment) =>
  ([Environment.TILT] as Environment[]).includes(environment)

export const hasAccessToDependencyMatrix = (environment: Environment) =>
  ([Environment.TILT] as Environment[]).includes(environment)

// environnement is not used but kept for consistency
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const hasAccessToDependencyMatrixExample = (environment: Environment) => false

export const hasAccessToPerimeterPage = (environment: Environment) =>
  !([Environment.CUT] as Environment[]).includes(environment)

export const needsLicenceToUseApp = (environment: Environment) =>
  ([Environment.BC] as Environment[]).includes(environment)
