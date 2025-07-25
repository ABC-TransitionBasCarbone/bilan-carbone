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
