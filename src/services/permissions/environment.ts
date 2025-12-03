import { Environment } from '@prisma/client'

const { BC, CUT, TILT, CLICKSON } = Environment
const advancedEnvironments: Environment[] = [BC, TILT]

export const hasAccessToEmissionFactor = (environment: Environment) =>
  ([BC, TILT] as Environment[]).includes(environment)

export const hasAccessToSettings = (environment: Environment) => ([BC, TILT] as Environment[]).includes(environment)

export const hasAccessToActualityCards = (environment: Environment) => environment === BC

export const hasAccessToDownloadStudyEmissionSourcesButton = (environment: Environment) =>
  ([BC, TILT] as Environment[]).includes(environment)

export const hasAccessToStudyCardDetails = (environment: Environment) =>
  ([BC, TILT] as Environment[]).includes(environment)

export const hasAccessToCreateOrganization = (environment: Environment) =>
  ([TILT, BC] as Environment[]).includes(environment)

export const hasAccessToDuplicateStudy = (environment: Environment) =>
  ([BC, TILT] as Environment[]).includes(environment)

export const hasAccessToCreateStudyTag = async (environment: Environment) =>
  ([BC, TILT] as Environment[]).includes(environment)

export const hasAccessToStudyFlowExample = (environment: Environment) =>
  ([TILT, BC] as Environment[]).includes(environment)

export const hasWasteImpact = (environment: Environment) => !([CUT, CLICKSON] as Environment[]).includes(environment)

export const hasAccessToBcExport = (environment: Environment) => ([TILT] as Environment[]).includes(environment)

export const hasAccessToDependencyMatrix = (environment: Environment) => ([TILT] as Environment[]).includes(environment)

// environnement is not used but kept for consistency
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const hasAccessToDependencyMatrixExample = (environment: Environment) => false

export const hasAccessToPerimeterPage = (environment: Environment) =>
  !([CUT, CLICKSON] as Environment[]).includes(environment)

export const needsLicenceToUseApp = (environment: Environment) => ([BC] as Environment[]).includes(environment)

export const hasAccessToEmissionSourceValidation = (environment: Environment) =>
  advancedEnvironments.includes(environment)

export const hasRoleOnStudy = (environment: Environment) => advancedEnvironments.includes(environment)
