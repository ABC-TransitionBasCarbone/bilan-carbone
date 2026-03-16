import { isFeatureActiveForEnvironment } from '@/db/deactivableFeatures'
import { DeactivatableFeature, Environment } from '@prisma/client'

const { BC, CUT, TILT, CLICKSON } = Environment
const advancedEnvironments: Environment[] = [BC, TILT]
const simplifiedEnvironments: Environment[] = [CUT, CLICKSON]

export const isAdvanced = (environment: Environment) => advancedEnvironments.includes(environment)
export const isSimplified = (environment: Environment) => simplifiedEnvironments.includes(environment)

const isBC = (environment: Environment) => environment === BC
export const isTilt = (environment: Environment) => environment === TILT
export const isCut = (environment: Environment) => environment === CUT
export const isClickson = (environment: Environment) => environment === CLICKSON

export const hasAccessToActualityCards = isBC

export const hasAccessToDownloadStudyEmissionSourcesButton = isAdvanced

export const hasAccessToStudyCardDetails = isAdvanced

export const hasAccessToCreateOrganization = isAdvanced

export const hasAccessToCreateStudyTag = isAdvanced

export const hasAccessToStudyFlowExample = isAdvanced

export const hasWasteImpact = isAdvanced

export const hasAccessToBcExport = isTilt

export const hasAccessToDependencyMatrix = isTilt

// environnement is not used but kept for consistency
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const hasAccessToDependencyMatrixExample = (environment: Environment) => false

export const needsLicenceToUseApp = isBC

export const hasAccessToEmissionSourceValidation = isAdvanced

export const hasRoleOnStudy = isAdvanced

export const hasAccessToCarbonResponsibilityIntensities = isAdvanced

export const hasAccessToMonetaryRatio = (environment: Environment) =>
  ([BC, TILT, CUT] as Environment[]).includes(environment)

export const hasAccessToCreateStudyWithEmissionFactorVersions = isSimplified

export const showResultsInfoText = isCut

export const displayingStudyRightModalForAddingContributors = (environment: Environment) => !isClickson(environment)

export const hasHomeAlert = isSimplified

export const hasAccessToAllLocales = isClickson

export const hasAccessToSimplifiedEmissionAnalysis = isClickson

export const canCreateStudyWithoutSpecificRights = isCut

export const canCreateStudyOnlyAsAdministrator = isClickson

export const hasAccessToStudySiteAddAndSelection = (environment: Environment) =>
  ([BC, TILT, CUT] as Environment[]).includes(environment)

export const hasAccessToStudyHomePage = isAdvanced

export const hasAccessToSimplifiedStudies = (env: Environment) => {
  return isSimplified(env) || isTilt(env)
}

export const hasReaderRoleOnStudyAsContributor = isClickson

export const hasAccessToStudyComments = isClickson

export const hasAccessToManualImport = (environment: Environment) =>
  ([BC, TILT, CUT] as Environment[]).includes(environment)

export const hasCustomGlossaryTextForEstablishment = isClickson

export const hasAccessToStudyResults = isAdvanced

export const hasCustomPostOrder = isClickson

export const hasAccessToResultsRatioTab = isCut

export const hasAccessToAdvancedEmissionAnalysis = isTilt

export const hasAlwaysAccessToOrganizationVersion = (environment: Environment) =>
  ([TILT, CLICKSON] as Environment[]).includes(environment)

export const hasStartLinkOnFootprints = isTilt

export const hasAccessToPostTypeform = isTilt

export const hasAccessToReductionObjectivesGlossary = isTilt

export const isTiltSimplifiedFeatureActive = async (environment: Environment) => {
  if (!isTilt(environment)) {
    return true
  }

  return isFeatureActiveForEnvironment(DeactivatableFeature.TiltSimplified, environment)
}

export const hasAccessToHomeSubtitle = isClickson

export const hasAccessToNamingInAddContributor = isClickson

export const hasHomeButtonHeader = isClickson

export const hasAccessToPDFExport = (environment: Environment) =>
  ([CUT, CLICKSON] as Environment[]).includes(environment)
