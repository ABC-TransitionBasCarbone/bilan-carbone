import { getAccountById } from '@/db/account'
import { getDocumentById } from '@/db/document'
import { OrganizationVersionWithOrganization } from '@/db/organization'
import { FullStudy, getStudyById } from '@/db/study'
import { getAccountByIdWithAllowedStudies, UserWithAllowedStudies } from '@/db/user'
import { isAdminOnOrga, isInOrgaOrParent } from '@/utils/organization'
import { getAccountRoleOnStudy, hasEditionRights } from '@/utils/study'
import { Environment, Level, Prisma, Study, StudyRole, User } from '@prisma/client'
import { UserSession } from 'next-auth'
import { dbActualizedAuth } from '../auth'
import { checkLevel } from '../study'
import { isInOrgaOrParentFromId } from './organization'

export const isAdminOnStudyOrga = (user: UserSession, studyOrganizationVersion: OrganizationVersionWithOrganization) =>
  isAdminOnOrga(user, studyOrganizationVersion)

export const canReadStudy = async (user: UserSession | UserWithAllowedStudies, studyId: string) => {
  if (!user) {
    return false
  }

  const study = await getStudyById(studyId, user.organizationVersionId)

  if (!study) {
    return false
  }

  if (
    isAdminOnStudyOrga(user as UserSession, study.organizationVersion as OrganizationVersionWithOrganization) ||
    (study.isPublic &&
      isInOrgaOrParent(user.organizationVersionId, study.organizationVersion as OrganizationVersionWithOrganization))
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

export const canCreateAStudy = (user: UserSession) => {
  return user.environment === Environment.CUT || (!!user.level && !!user.organizationVersionId)
}

const canCreateSpecificStudyCommon = async (
  accountId: string,
  study: Prisma.StudyCreateInput,
  organizationVersionId: string,
) => {
  const dbAccount = await getAccountById(accountId)

  if (!dbAccount) {
    return { allowed: false }
  }

  if (!(await isInOrgaOrParentFromId(dbAccount.organizationVersionId, organizationVersionId))) {
    return { allowed: false }
  }

  return { allowed: true, account: dbAccount }
}

const canCreateSpecificStudyCUT = async (
  accountId: string,
  study: Prisma.StudyCreateInput,
  organizationVersionId: string,
) => {
  const { allowed } = await canCreateSpecificStudyCommon(accountId, study, organizationVersionId)
  return allowed
}

const canCreateSpecificStudyBC = async (
  accountId: string,
  study: Prisma.StudyCreateInput,
  organizationVersionId: string,
) => {
  const { allowed: commonRights, account: dbAccount } = await canCreateSpecificStudyCommon(
    accountId,
    study,
    organizationVersionId,
  )

  if (!commonRights || !dbAccount || !checkLevel(dbAccount.user.level, study.level)) {
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
    case Environment.CUT:
      return canCreateSpecificStudyCUT(user.accountId, study, organizationVersionId)
    case Environment.BC:
      return canCreateSpecificStudyBC(user.accountId, study, organizationVersionId)
    default:
      return false
  }
}

const canChangeStudyValues = async (user: UserSession, study: FullStudy) => {
  if (isAdminOnStudyOrga(user, study.organizationVersion as OrganizationVersionWithOrganization)) {
    return true
  }

  const userRightsOnStudy = await getAccountRoleOnStudy(user, study)
  if (!userRightsOnStudy || !hasEditionRights(userRightsOnStudy)) {
    return false
  }

  return true
}

export const canChangePublicStatus = async (user: UserSession, study: FullStudy) => {
  return canChangeStudyValues(user, study)
}

export const canUpgradeSourceVersion = async (user: UserSession, study: FullStudy) => {
  return canChangeStudyValues(user, study)
}

export const canChangeDates = async (user: UserSession, study: FullStudy) => {
  return canChangeStudyValues(user, study)
}

export const canChangeSites = async (user: UserSession, study: FullStudy) => {
  return canChangeStudyValues(user, study)
}

export const canChangeLevel = async (user: UserSession, study: FullStudy, level: Level) => {
  if (!(await canChangeStudyValues(user, study))) {
    return false
  }

  if (!checkLevel(user.level, level)) {
    return false
  }

  return true
}

export const canChangeResultsUnit = async (user: UserSession, study: FullStudy) => {
  return canChangeStudyValues(user, study)
}

export const canChangeName = async (user: UserSession, study: FullStudy) => {
  return canChangeStudyValues(user, study)
}

export const canChangeOpeningHours = async (user: UserSession, study: FullStudy) => {
  return canChangeStudyValues(user, study)
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
  if (isAdminOnStudyOrga(user, study.organizationVersion as OrganizationVersionWithOrganization)) {
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

  const accountRoleOnStudy = await getAccountRoleOnStudy(session.user, study)

  if (accountRoleOnStudy && accountRoleOnStudy === StudyRole.Validator) {
    return true
  }

  return false
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
    isAdminOnStudyOrga(user, study.organizationVersion as OrganizationVersionWithOrganization) ||
    (study.isPublic &&
      isInOrgaOrParent(user.organizationVersionId, study.organizationVersion as OrganizationVersionWithOrganization))
  ) {
    return true
  }

  const userRightsOnStudy = study.allowedUsers.find((right) => right.account.user.email === user.email)
  if (!userRightsOnStudy) {
    return false
  }

  return true
}

const canAccessStudyFlows = async (studyId: string) => {
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
