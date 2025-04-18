import { getDocumentById } from '@/db/document'
import { FullStudy, getStudyById } from '@/db/study'
import { getUserByEmailWithAllowedStudies, UserWithAllowedStudies } from '@/db/user'
import { getUserByEmail } from '@/db/userImport'
import { isAdminOnOrga, isInOrgaOrParent } from '@/utils/organization'
import { getUserRoleOnStudy, hasEditionRights } from '@/utils/study'
import { User as DbUser, Level, Organization, Prisma, Study, StudyRole } from '@prisma/client'
import { User } from 'next-auth'
import { auth } from '../auth'
import { checkLevel } from '../study'
import { isInOrgaOrParentFromId } from './organization'

export const isAdminOnStudyOrga = (user: User, studyOrganization: Pick<Organization, 'id' | 'parentId'>) =>
  isAdminOnOrga(user, studyOrganization)

export const canReadStudy = async (user: User | UserWithAllowedStudies, studyId: string) => {
  if (!user) {
    return false
  }

  const study = await getStudyById(studyId, user.organizationId)

  if (!study) {
    return false
  }

  if (
    isAdminOnStudyOrga(user, study.organization) ||
    (study.isPublic && isInOrgaOrParent(user.organizationId, study.organization))
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
    const userWithAllowedStudies = await getUserByEmailWithAllowedStudies(user.email)
    if (!userWithAllowedStudies) {
      return false
    }
    allowedStudiesId = [
      ...userWithAllowedStudies.allowedStudies.map((allowedStudy) => allowedStudy.studyId),
      ...userWithAllowedStudies.contributors.map((contributor) => contributor.studyId),
    ]
  }

  if (allowedStudiesId.some((allowedStudiesId) => allowedStudiesId === study.id)) {
    return true
  }

  return false
}

export const filterAllowedStudies = async (user: User, studies: Study[]) => {
  const userWithAllowedStudies = await getUserByEmailWithAllowedStudies(user.email)

  const allowedStudies = await Promise.all(
    studies.map(async (study) => ((await canReadStudy(userWithAllowedStudies, study.id)) ? study : null)),
  )
  return allowedStudies.filter((study) => study !== null)
}

export const canCreateStudy = async (userEmail: string, study: Prisma.StudyCreateInput, organizationId: string) => {
  const dbUser = await getUserByEmail(userEmail)

  if (!dbUser) {
    return false
  }

  if (!checkLevel(dbUser.level, study.level)) {
    return false
  }

  if (!(await isInOrgaOrParentFromId(dbUser.organizationId, organizationId))) {
    return false
  }

  return true
}

const canChangeStudyValues = async (user: User, study: FullStudy) => {
  if (isAdminOnStudyOrga(user, study.organization)) {
    return true
  }

  const userRightsOnStudy = await getUserRoleOnStudy(user, study)
  if (!userRightsOnStudy || !hasEditionRights(userRightsOnStudy)) {
    return false
  }

  return true
}

export const canChangePublicStatus = async (user: User, study: FullStudy) => {
  return canChangeStudyValues(user, study)
}

export const canUpgradeSourceVersion = async (user: User, study: FullStudy) => {
  return canChangeStudyValues(user, study)
}

export const canChangeDates = async (user: User, study: FullStudy) => {
  return canChangeStudyValues(user, study)
}

export const canChangeSites = async (user: User, study: FullStudy) => {
  return canChangeStudyValues(user, study)
}

export const canChangeLevel = async (user: User, study: FullStudy, level: Level) => {
  if (!(await canChangeStudyValues(user, study))) {
    return false
  }

  if (!checkLevel(user.level, level)) {
    return false
  }

  return true
}

export const canChangeResultsUnit = async (user: User, study: FullStudy) => {
  return canChangeStudyValues(user, study)
}

export const canChangeName = async (user: User, study: FullStudy) => {
  return canChangeStudyValues(user, study)
}

export const canChangeOpeningHours = async (user: User, study: FullStudy) => {
  return canChangeStudyValues(user, study)
}

export const canAddRightOnStudy = (user: User, study: FullStudy, userToAddOnStudy: DbUser | null, role: StudyRole) => {
  if (userToAddOnStudy && user.id === userToAddOnStudy.id) {
    return false
  }

  if ((!userToAddOnStudy || !userToAddOnStudy.organizationId) && role !== StudyRole.Reader) {
    return false
  }

  const userRoleOnStudy = getUserRoleOnStudy(user, study)

  if (!userRoleOnStudy || userRoleOnStudy === StudyRole.Reader) {
    return false
  }

  if (role === StudyRole.Validator && userRoleOnStudy !== StudyRole.Validator) {
    return false
  }

  return true
}

export const canAddContributorOnStudy = (user: User, study: FullStudy) => {
  if (isAdminOnStudyOrga(user, study.organization)) {
    return true
  }

  const userRightsOnStudy = getUserRoleOnStudy(user, study)
  if (!userRightsOnStudy || userRightsOnStudy === StudyRole.Reader) {
    return false
  }

  return true
}

export const canDeleteStudy = async (studyId: string) => {
  const session = await auth()

  if (!session) {
    return false
  }

  const study = await getStudyById(studyId, session.user.organizationId)
  if (!study) {
    return false
  }

  if (study.createdById === session.user.id) {
    return true
  }

  const userRoleOnStudy = await getUserRoleOnStudy(session.user, study)
  if (userRoleOnStudy === StudyRole.Validator) {
    return true
  }

  return false
}

export const filterStudyDetail = (user: User, study: FullStudy) => {
  const availableSubPosts = study.contributors
    .filter((contributor) => contributor.user.email === user.email)
    .map((contributor) => contributor.subPost)

  return {
    withoutDetail: true as const,
    id: study.id,
    name: study.name,
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
  }
}
export type StudyWithoutDetail = ReturnType<typeof filterStudyDetail>

export const canReadStudyDetail = async (user: User, study: FullStudy) => {
  const studyRight = await canReadStudy(user, study.id)
  if (!studyRight) {
    return false
  }

  if (
    isAdminOnStudyOrga(user, study.organization) ||
    (study.isPublic && isInOrgaOrParent(user.organizationId, study.organization))
  ) {
    return true
  }

  const userRightsOnStudy = study.allowedUsers.find((right) => right.user.email === user.email)
  if (!userRightsOnStudy) {
    return false
  }

  return true
}

const canAccessStudyFlows = async (studyId: string) => {
  const session = await auth()

  if (!session || !session.user) {
    return false
  }

  const study = await getStudyById(studyId, session.user.organizationId)
  if (!study || !getUserRoleOnStudy(session.user, study)) {
    return false
  }

  return true
}

export const canEditStudyFlows = async (studyId: string) => {
  const session = await auth()
  if (!session) {
    return false
  }
  const study = await getStudyById(studyId, session.user.organizationId)

  if (!study) {
    return false
  }

  const userRoleOnStudy = getUserRoleOnStudy(session.user, study)
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
