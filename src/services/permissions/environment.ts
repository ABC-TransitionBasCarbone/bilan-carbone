import { Environment } from '@prisma/client'

const { BC, CUT, TILT, CLICKSON } = Environment
const advancedEnvironments: Environment[] = [BC, TILT]
const simplifiedEnvironments: Environment[] = [CUT, CLICKSON]

const isAdvanced = (environment: Environment) => advancedEnvironments.includes(environment)
const isSimplified = (environment: Environment) => simplifiedEnvironments.includes(environment)

const isBC = (environment: Environment) => environment === BC
export const isTilt = (environment: Environment) => environment === TILT
const isCut = (environment: Environment) => environment === CUT
const isClickson = (environment: Environment) => environment === CLICKSON

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
  ([BC, TILT, CUT] as Environment[]).includes(environment)

export const hasAccessToMonetaryRatio = (environment: Environment) =>
  ([BC, TILT, CUT] as Environment[]).includes(environment)

export const hasAccessToCreateStudyWithEmissionFactorVersions = isSimplified

export const showResultsInfoText = isCut

export const displayingStudyRightModalForAddingContributors = (environment: Environment) => !isClickson(environment)

export const hasHomeAlert = isSimplified

export const hasAccessToAllLocales = isClickson

export const hasAccessToSimplifiedEmissionAnalysis = isClickson

export const hasAccessToMethodology = (environment: Environment) =>
  ([BC, TILT, CLICKSON] as Environment[]).includes(environment)
