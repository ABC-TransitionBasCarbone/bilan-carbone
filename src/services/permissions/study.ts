import { getDocumentById } from '@/db/document'
import { FullStudy, getStudyById } from '@/db/study'
import { getUserByEmail, getUserByEmailWithAllowedStudies, UserWithAllowedStudies } from '@/db/user'
import { getUserRoleOnStudy } from '@/utils/study'
import { User as DbUser, Level, Prisma, Study, StudyRole } from '@prisma/client'
import { User } from 'next-auth'
import { auth } from '../auth'
import { checkLevel } from '../study'
import { checkOrganization } from './organization'
import { isAdmin } from './user'

export const isAdminOnStudyOrga = (user: User, study: Pick<FullStudy, 'organizationId' | 'organization'>) =>
  (user.organizationId === study.organizationId || user.organizationId === study.organization.parentId) &&
  isAdmin(user.role)

export const canReadStudy = async (user: User | UserWithAllowedStudies, studyId: string) => {
  if (!user) {
    return false
  }

  const study = await getStudyById(studyId, user.organizationId)

  if (!study) {
    return false
  }

  if (
    isAdminOnStudyOrga(user, study) ||
    (study.isPublic && (await checkOrganization(user.organizationId, study.organizationId)))
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

  if (!(await checkOrganization(dbUser.organizationId, organizationId))) {
    return false
  }

  return true
}

const canChangeStudyValues = async (user: User, study: FullStudy) => {
  if (isAdminOnStudyOrga(user, study)) {
    return true
  }

  const userRightsOnStudy = study.allowedUsers.find((right) => right.user.email === user.email)
  if (!userRightsOnStudy || userRightsOnStudy.role === StudyRole.Reader) {
    return false
  }

  return true
}

export const canChangePublicStatus = async (user: User, study: FullStudy) => {
  return canChangeStudyValues(user, study)
}

export const canChangeDates = async (user: User, study: FullStudy) => {
  return canChangeStudyValues(user, study)
}

export const canChangeSites = async (user: User, study: FullStudy) => {
  return canChangeStudyValues(user, study)
}

export const canChangeLevel = async (user: User, study: FullStudy, level: Level) => {
  const basicRight = canChangeStudyValues(user, study)
  if (!basicRight) {
    return false
  }

  if (!checkLevel(user.level, level)) {
    return false
  }

  const userRightsOnStudy = study.allowedUsers.find((right) => right.user.email === user.email)
  if (!userRightsOnStudy || userRightsOnStudy.role !== StudyRole.Validator) {
    return false
  }

  return true
}

export const canAddRightOnStudy = (user: User, study: FullStudy, userToAddOnStudy: DbUser | null, role: StudyRole) => {
  if (userToAddOnStudy && user.id === userToAddOnStudy.id) {
    return false
  }

  if ((!userToAddOnStudy || !userToAddOnStudy.organizationId) && role !== StudyRole.Reader) {
    return false
  }

  if (isAdminOnStudyOrga(user, study)) {
    return true
  }

  const userRightsOnStudy = study.allowedUsers.find((right) => right.user.email === user.email)
  if (!userRightsOnStudy || userRightsOnStudy.role === StudyRole.Reader) {
    return false
  }

  if (role === StudyRole.Validator && userRightsOnStudy.role !== StudyRole.Validator) {
    return false
  }

  return true
}

export const canAddContributorOnStudy = (user: User, study: FullStudy) => {
  if (isAdminOnStudyOrga(user, study)) {
    return true
  }

  const userRightsOnStudy = study.allowedUsers.find((right) => right.user.email === user.email)
  if (!userRightsOnStudy || userRightsOnStudy.role === StudyRole.Reader) {
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

  if (
    study.allowedUsers.some(
      (allowedUser) => allowedUser.role === StudyRole.Validator && allowedUser.user.email === session.user.email,
    )
  ) {
    return true
  }

  if (isAdminOnStudyOrga(session.user, study)) {
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
    isAdminOnStudyOrga(user, study) ||
    (study.isPublic && (await checkOrganization(user.organizationId, study.organizationId)))
  ) {
    return true
  }

  const userRightsOnStudy = study.allowedUsers.find((right) => right.user.email === user.email)
  if (!userRightsOnStudy) {
    return false
  }

  return true
}

const canAccessStudyFlow = async (studyId: string) => {
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

export const canAddFlowToStudy = async (studyId: string) => canAccessStudyFlow(studyId)

export const canAccessFlowFromStudy = async (documentId: string, studyId: string) => {
  if (!(await canAccessStudyFlow(studyId))) {
    return false
  }

  const document = await getDocumentById(documentId)

  if (!document || document?.studyId !== studyId) {
    return false
  }

  return true
}
