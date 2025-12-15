import { getAccountById } from '@/db/account'
import { getDocumentById } from '@/db/document'
import { getOrganizationVersionById, getOrganizationVersionsByOrganizationId } from '@/db/organization'
import { FullStudy, getStudyById } from '@/db/study'
import { getAccountByIdWithAllowedStudies, UserWithAllowedStudies } from '@/db/user'
import { canEditOrganizationVersion, hasActiveLicence, isAdminOnOrga, isInOrgaOrParent } from '@/utils/organization'
import { getAccountRoleOnStudy, getDuplicableEnvironments, hasEditionRights } from '@/utils/study'
import { DeactivatableFeature, Environment, Level, Prisma, Role, Study, StudyRole, User } from '@prisma/client'
import { UserSession } from 'next-auth'
import { dbActualizedAuth } from '../auth'
import { isDeactivableFeatureActiveForEnvironment } from '../serverFunctions/deactivableFeatures'
import { getUserActiveAccounts } from '../serverFunctions/user'
import { hasSufficientLevel } from '../study'
import { hasAccessToDuplicateStudy, isTilt } from './environment'
import { isInOrgaOrParentFromId } from './organization'

export const isAdminOnStudyOrga = (
  user: UserSession,
  studyOrganizationVersion: {
    id: string
    parentId: string | null
  },
) => isAdminOnOrga(user, studyOrganizationVersion)

export const canReadStudy = async (user: UserSession | UserWithAllowedStudies, studyId: string) => {
  if (!user) {
    return false
  }

  const study = await getStudyById(studyId, user.organizationVersionId)

  if (!study) {
    return false
  }

  if (
    isAdminOnStudyOrga(user as UserSession, study.organizationVersion) ||
    (study.isPublic && isInOrgaOrParent(user.organizationVersionId, study.organizationVersion))
  ) {
    return true
  }

  let allowedStudiesId: string[]
  if ('allowedStudies' in user) {
    allowedStudiesId = [
      ...user.allowedStudies.map((allowedStudy) => allowedStudy.studyId),
      ...user.contributors.map((contributor) => contributor.studyId),
    ]
  } else {
    const accountWithAllowedStudies = await getAccountByIdWithAllowedStudies(user.accountId)
    if (!accountWithAllowedStudies) {
      return false
    }
    allowedStudiesId = [
      ...accountWithAllowedStudies.allowedStudies.map((allowedStudy) => allowedStudy.studyId),
      ...accountWithAllowedStudies.contributors.map((contributor) => contributor.studyId),
    ]
  }

  if (allowedStudiesId.some((allowedStudiesId) => allowedStudiesId === study.id)) {
    return true
  }

  return false
}

export const filterAllowedStudies = async (user: UserSession, studies: Study[]) => {
  const userWithAllowedStudies = await getAccountByIdWithAllowedStudies(user.accountId)

  const allowedStudies = await Promise.all(
    studies.map(async (study) => ((await canReadStudy(userWithAllowedStudies, study.id)) ? study : null)),
  )
  return allowedStudies.filter((study) => study !== null)
}

export const canCreateAStudy = (user: UserSession) =>
  user.environment === Environment.CUT ||
  (!!user.level && !!user.organizationVersionId) ||
  (isTilt(user.environment) && user.role !== Role.DEFAULT)

const canCreateSpecificStudyCommon = async (accountId: string, organizationVersionId: string) => {
  const dbAccount = await getAccountById(accountId)

  if (!dbAccount) {
    return { allowed: false }
  }

  if (!(await isInOrgaOrParentFromId(dbAccount.organizationVersionId, organizationVersionId))) {
    return { allowed: false }
  }

  const organizationVersion = await getOrganizationVersionById(organizationVersionId)
  if (!organizationVersion || !hasActiveLicence(organizationVersion)) {
    return { allowed: false }
  }

  return { allowed: true, account: dbAccount }
}

const canCreateSpecificStudyCUT = async (
  accountId: string,
  study: Prisma.StudyCreateInput,
  organizationVersionId: string,
) => {
  const { allowed } = await canCreateSpecificStudyCommon(accountId, organizationVersionId)
  return allowed
}

const canCreateSpecificStudyClickson = async (
  accountId: string,
  study: Prisma.StudyCreateInput,
  organizationVersionId: string,
) => {
  const { allowed } = await canCreateSpecificStudyCommon(accountId, organizationVersionId)
  return allowed
}

const canCreateSpecificStudyBC = async (
  accountId: string,
  study: Prisma.StudyCreateInput,
  organizationVersionId: string,
) => {
  const { allowed: commonRights, account: dbAccount } = await canCreateSpecificStudyCommon(
    accountId,
    organizationVersionId,
  )

  if (!commonRights || !dbAccount || !hasSufficientLevel(dbAccount.user.level, study.level)) {
    return false
  }

  return true
}

export const canCreateSpecificStudy = async (
  user: UserSession,
  study: Prisma.StudyCreateInput,
  organizationVersionId: string,
) => {
  switch (user.environment) {
    case Environment.CLICKSON:
      return canCreateSpecificStudyClickson(user.accountId, study, organizationVersionId)
    case Environment.CUT:
      return canCreateSpecificStudyCUT(user.accountId, study, organizationVersionId)
    case Environment.TILT:
    case Environment.BC:
      return canCreateSpecificStudyBC(user.accountId, study, organizationVersionId)
    default:
      return false
  }
}

const canEditStudy = async (user: UserSession, study: FullStudy) => {
  const organizationVersion = await getOrganizationVersionById(
    study.organizationVersion.parentId ? study.organizationVersion.parentId : study.organizationVersionId,
  )
  if (!organizationVersion) {
    return false
  }

  if (!hasActiveLicence(organizationVersion)) {
    return false
  }

  if (isAdminOnStudyOrga(user, study.organizationVersion)) {
    return true
  }

  const userRightsOnStudy = getAccountRoleOnStudy(user, study)
  if (!userRightsOnStudy || !hasEditionRights(userRightsOnStudy)) {
    return false
  }

  return true
}

export const canChangePublicStatus = async (user: UserSession, study: FullStudy) => {
  return canEditStudy(user, study)
}

export const canUpgradeSourceVersion = async (user: UserSession, study: FullStudy) => {
  return canEditStudy(user, study)
}

export const canChangeDates = async (user: UserSession, study: FullStudy) => {
  return canEditStudy(user, study)
}

export const canChangeSites = async (user: UserSession, study: FullStudy) => {
  return canEditStudy(user, study)
}

export const canChangeLevel = async (user: UserSession, study: FullStudy, level: Level) => {
  if (!(await canEditStudy(user, study))) {
    return false
  }

  if (!hasSufficientLevel(user.level, level)) {
    return false
  }

  return true
}

export const canChangeResultsUnit = async (user: UserSession, study: FullStudy) => {
  return canEditStudy(user, study)
}

export const canChangeName = async (user: UserSession, study: FullStudy) => {
  return canEditStudy(user, study)
}

export const canChangeOpeningHours = async (user: UserSession, study: FullStudy) => {
  return canEditStudy(user, study)
}

export const canAddRightOnStudy = (
  user: UserSession,
  study: FullStudy,
  userToAddOnStudy: User | null,
  role: StudyRole,
) => {
  if (userToAddOnStudy && user.accountId === userToAddOnStudy.id) {
    return false
  }

  if (!userToAddOnStudy && role !== StudyRole.Reader) {
    return false
  }

  const userRoleOnStudy = getAccountRoleOnStudy(user, study)

  if (!userRoleOnStudy || userRoleOnStudy === StudyRole.Reader) {
    return false
  }

  if (role === StudyRole.Validator && userRoleOnStudy !== StudyRole.Validator) {
    return false
  }

  return true
}

export const canAddContributorOnStudy = (user: UserSession, study: FullStudy) => {
  if (isAdminOnStudyOrga(user, study.organizationVersion)) {
    return true
  }

  const userRightsOnStudy = getAccountRoleOnStudy(user, study)
  if (!userRightsOnStudy || userRightsOnStudy === StudyRole.Reader) {
    return false
  }

  return true
}

export const canDeleteStudy = async (studyId: string) => {
  const session = await dbActualizedAuth()

  if (!session) {
    return false
  }

  const study = await getStudyById(studyId, session.user.organizationVersionId)

  if (!study) {
    return false
  }

  if (study.createdById === session.user.accountId) {
    return true
  }

  const accountRoleOnStudy = getAccountRoleOnStudy(session.user, study)

  if (accountRoleOnStudy && accountRoleOnStudy === StudyRole.Validator) {
    return true
  }

  return false
}

export const canDuplicateStudy = async (studyId: string) => {
  const session = await dbActualizedAuth()

  if (!session) {
    return false
  }

  if (!hasAccessToDuplicateStudy(session.user.environment)) {
    return false
  }

  const study = await getStudyById(studyId, session.user.organizationVersionId)

  if (!study) {
    return false
  }

  const canEditOrga = canEditOrganizationVersion(session.user, study.organizationVersion)
  if (!canEditOrga) {
    return false
  }

  const accountRoleOnStudy = getAccountRoleOnStudy(session.user, study)
  if (!accountRoleOnStudy || accountRoleOnStudy !== StudyRole.Validator) {
    return false
  }

  return true
}

export const getEnvironmentsForDuplication = async (studyId: string) => {
  const [canDuplicate, session] = await Promise.all([canDuplicateStudy(studyId), dbActualizedAuth()])
  if (!canDuplicate || !session) {
    return []
  }

  const [study, userAccounts] = await Promise.all([
    getStudyById(studyId, session.user.organizationVersionId),
    getUserActiveAccounts(),
  ])
  if (
    !study ||
    (study.organizationVersionId !== session.user.organizationVersionId &&
      study.organizationVersion.parentId !== session.user.organizationVersionId) ||
    !userAccounts.success ||
    !userAccounts.data.length
  ) {
    return []
  }

  const eligibleOrganizationVersions = await getOrganizationVersionsByOrganizationId(
    study.organizationVersion.organization.id,
  )

  const versionIds = eligibleOrganizationVersions.map((organizationVersion) => organizationVersion.id)
  const parentsIds = eligibleOrganizationVersions.map((organizationVersion) => organizationVersion.parentId)

  const eligibleEnvironments = getDuplicableEnvironments(session.user.environment)
  return userAccounts.data
    .filter(
      (userAccount) =>
        // environments match
        eligibleEnvironments.includes(userAccount.environment) &&
        // user is within an organization
        userAccount.organizationVersionId &&
        // Account's organizationVersion is amongst the eligible organisation version for the study
        (versionIds.includes(userAccount.organizationVersionId) ||
          // OR account's organizationVersion is the study parent's organization AND is from the same environment (no cross-environment duplication for cr clients #1897)
          (parentsIds.includes(userAccount.organizationVersionId) &&
            userAccount.environment === study.organizationVersion.environment)),
    )
    .map((eligibleEnvironment) => eligibleEnvironment.environment)
}

export const filterStudyDetail = (user: UserSession, study: FullStudy) => {
  const availableSubPosts = study.contributors
    .filter((contributor) => contributor.account.user.email === user.email)
    .map((contributor) => contributor.subPost)

  return {
    withoutDetail: true as const,
    id: study.id,
    name: study.name,
    level: study.level,
    sites: study.sites,
    resultsUnit: study.resultsUnit,
    emissionSources: study.emissionSources
      .filter((emissionSource) => availableSubPosts.includes(emissionSource.subPost))
      .map((emissionSource) => ({
        id: emissionSource.id,
        contributor: emissionSource.contributor,
        name: emissionSource.name,
        validated: emissionSource.validated,
        subPost: emissionSource.subPost,
        emissionFactorId: emissionSource.emissionFactorId,
        emissionFactor: emissionSource.emissionFactor,
        value: emissionSource.value,
        reliability: emissionSource.reliability,
        technicalRepresentativeness: emissionSource.technicalRepresentativeness,
        geographicRepresentativeness: emissionSource.geographicRepresentativeness,
        temporalRepresentativeness: emissionSource.temporalRepresentativeness,
        completeness: emissionSource.completeness,
        feReliability: emissionSource.feReliability,
        feTechnicalRepresentativeness: emissionSource.feTechnicalRepresentativeness,
        feGeographicRepresentativeness: emissionSource.feGeographicRepresentativeness,
        feTemporalRepresentativeness: emissionSource.feTemporalRepresentativeness,
        feCompleteness: emissionSource.feCompleteness,
        source: emissionSource.source,
        type: emissionSource.type,
        caracterisation: emissionSource.caracterisation,
        studySite: emissionSource.studySite,
        depreciationPeriod: emissionSource.depreciationPeriod,
        hectare: emissionSource.hectare,
        duration: emissionSource.duration,
      })),
    exports: study.exports,
    contributors: undefined,
    allowedUser: undefined,
    emissionFactorVersions: study.emissionFactorVersions,
  }
}
export type StudyWithoutDetail = ReturnType<typeof filterStudyDetail>

export const canReadStudyDetail = async (user: UserSession, study: FullStudy) => {
  const studyRight = await canReadStudy(user, study.id)
  if (!studyRight) {
    return false
  }

  if (
    isAdminOnStudyOrga(user, study.organizationVersion) ||
    (study.isPublic && isInOrgaOrParent(user.organizationVersionId, study.organizationVersion))
  ) {
    return true
  }

  const userRightsOnStudy = study.allowedUsers.find((right) => right.account.user.email === user.email)
  if (!userRightsOnStudy) {
    return false
  }

  return true
}

export const canAccessStudyFlows = async (studyId: string) => {
  const session = await dbActualizedAuth()

  if (!session || !session.user) {
    return false
  }

  const study = await getStudyById(studyId, session.user.organizationVersionId)
  if (!study || !getAccountRoleOnStudy(session.user, study)) {
    return false
  }

  return true
}

export const canEditStudyFlows = async (studyId: string) => {
  const session = await dbActualizedAuth()
  if (!session) {
    return false
  }
  const study = await getStudyById(studyId, session.user.organizationVersionId)

  if (!study) {
    return false
  }

  const userRoleOnStudy = getAccountRoleOnStudy(session.user, study)
  if (!userRoleOnStudy || userRoleOnStudy === StudyRole.Reader) {
    return false
  }

  return true
}

export const canAccessFlowFromStudy = async (documentId: string, studyId: string) => {
  if (!(await canAccessStudyFlows(studyId))) {
    return false
  }

  const document = await getDocumentById(documentId)

  if (!document || document?.studyId !== studyId) {
    return false
  }

  return true
}

export const hasAccessToFormationStudy = async (userAccount: Prisma.AccountCreateInput) => {
  const isFormationStudyFeatureActive = await isDeactivableFeatureActiveForEnvironment(
    DeactivatableFeature.FormationStudy,
    userAccount.environment,
  )
  return isFormationStudyFeatureActive.success && isFormationStudyFeatureActive.data
}

export const hasReadAccessOnStudy = async (studyId: string) => {
  const session = await dbActualizedAuth()
  if (!session || !session.user) {
    return false
  }

  return canReadStudy(session.user, studyId)
}

export const hasEditAccessOnStudy = async (studyId: string) => {
  const session = await dbActualizedAuth()
  if (!session || !session.user) {
    return false
  }

  const study = await getStudyById(studyId, session.user.organizationVersionId)
  if (!study) {
    return false
  }

  return canEditStudy(session.user, study)
}
