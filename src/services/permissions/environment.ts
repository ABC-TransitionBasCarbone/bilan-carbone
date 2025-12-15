import { Environment } from '@prisma/client'

const { BC, CUT, TILT, CLICKSON } = Environment
const advancedEnvironments: Environment[] = [BC, TILT]
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const simplifiedEnvironments: Environment[] = [CUT, CLICKSON]

const isAdvanced = (environment: Environment) => advancedEnvironments.includes(environment)
const isBC = (environment: Environment) => environment === BC
const isTilt = (environment: Environment) => environment === TILT
const isSimplified = (environment: Environment) => simplifiedEnvironments.includes(environment)

export const hasAccessToEmissionFactor = isAdvanced

export const hasAccessToSettings = isAdvanced

export const hasAccessToActualityCards = isBC

export const hasAccessToDownloadStudyEmissionSourcesButton = isAdvanced

export const hasAccessToStudyCardDetails = isAdvanced

export const hasAccessToCreateOrganization = isAdvanced

export const hasAccessToDuplicateStudy = isAdvanced

export const hasAccessToCreateStudyTag = isAdvanced

export const hasAccessToStudyFlowExample = isAdvanced

export const hasWasteImpact = isAdvanced

export const hasAccessToBcExport = isTilt

export const hasAccessToDependencyMatrix = isTilt

// environnement is not used but kept for consistency
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const hasAccessToDependencyMatrixExample = (environment: Environment) => false

export const hasAccessToPerimeterPage = isAdvanced

export const needsLicenceToUseApp = isBC

export const hasAccessToEmissionSourceValidation = isAdvanced

export const hasRoleOnStudy = isAdvanced

export const hasAccessToCarbonResponsibilityIntensities = (environment: Environment) =>
  ([Environment.BC, Environment.TILT, Environment.CUT] as Environment[]).includes(environment)

export const hasAccessToMonetaryRatio = (environment: Environment) =>
  ([Environment.BC, Environment.TILT, Environment.CUT] as Environment[]).includes(environment)

export const hasAccessToCreateStudyWithEmissionFactorVersions = isSimplified

export const notDisplayingStudyRightModalForAddingContributors = (environment: Environment) =>
  ([CLICKSON] as Environment[]).includes(environment)

export const hasAccessToAllLocales = (environment: Environment) => ([CLICKSON] as Environment[]).includes(environment)
