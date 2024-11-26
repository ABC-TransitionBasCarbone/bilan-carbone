import { FullStudy } from '@/db/study'
import { getUserByEmail, getUserByEmailWithAllowedStudies, UserWithAllowedStudies } from '@/db/user'
import { User as DbUser, Level, Prisma, Role, Study, StudyRole } from '@prisma/client'
import { User } from 'next-auth'
import { getAllowedLevels } from '../study'
import { checkOrganization } from './organization'

const checkLevel = (userLevel: Level | null, studyLevel: Level) =>
  userLevel ? getAllowedLevels(studyLevel).includes(userLevel) : false

export const canReadStudy = async (
  user: User | UserWithAllowedStudies,
  study: Pick<Study, 'id' | 'organizationId' | 'isPublic'>,
) => {
  if (!user) {
    return false
  }

  if (study.isPublic) {
    if (await checkOrganization(user.organizationId, study.organizationId)) {
      return true
    }
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
    studies.map(async (study) => ((await canReadStudy(userWithAllowedStudies, study)) ? study : null)),
  )
  return allowedStudies.filter((study) => study !== null)
}

export const canCreateStudy = async (user: User, study: Prisma.StudyCreateInput, organizationId: string) => {
  const dbUser = await getUserByEmail(user.email)

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
  if (user.role === Role.ADMIN) {
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

export const canChangeLevel = async (user: User, study: FullStudy, level: Level) => {
  const basicRight = canChangeStudyValues(user, study)
  if (!basicRight) {
    return false
  }

  if (!getAllowedLevels(user.level).includes(level)) {
    return false
  }

  const userRightsOnStudy = study.allowedUsers.find((right) => right.user.email === user.email)
  if (!userRightsOnStudy || userRightsOnStudy.role !== StudyRole.Validator) {
    return false
  }

  return true
}

export const canAddRightOnStudy = (user: User, study: FullStudy, newUser: DbUser | null, role: StudyRole) => {
  if (newUser && user.id === newUser.id) {
    return false
  }

  if ((!newUser || !newUser.organizationId) && role !== StudyRole.Reader) {
    return false
  }

  if (user.role === Role.ADMIN) {
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
  if (user.role === Role.ADMIN) {
    return true
  }

  const userRightsOnStudy = study.allowedUsers.find((right) => right.user.email === user.email)
  if (!userRightsOnStudy || userRightsOnStudy.role === StudyRole.Reader) {
    return false
  }

  return true
}

export const filterStudyDetail = (user: User, study: FullStudy) => {
  const availableSubPosts = study.contributors
    .filter((contributor) => contributor.user.email === user.email)
    .map((contributor) => contributor.subPost)

  return {
    withoutDetail: true as const,
    id: study.id,
    name: study.name,
    emissionSources: study.emissionSources
      .filter((emissionSource) => availableSubPosts.includes(emissionSource.subPost))
      .map((emissionSource) => ({
        id: emissionSource.id,
        contributor: emissionSource.contributor,
        name: emissionSource.name,
        caracterisation: emissionSource.caracterisation,
        validated: emissionSource.validated,
        subPost: emissionSource.subPost,
        emissionFactor: emissionSource.emissionFactor,
        value: emissionSource.value,
        comment: emissionSource.comment,
        reliability: emissionSource.reliability,
        technicalRepresentativeness: emissionSource.technicalRepresentativeness,
        geographicRepresentativeness: emissionSource.geographicRepresentativeness,
        temporalRepresentativeness: emissionSource.temporalRepresentativeness,
        completeness: emissionSource.completeness,
        source: emissionSource.source,
      })),
    contributors: undefined,
    allowedUser: undefined,
  }
}
export type StudyWithoutDetail = ReturnType<typeof filterStudyDetail>

export const canReadStudyDetail = async (user: User, study: FullStudy) => {
  const studyRight = await canReadStudy(user, study)
  if (!studyRight) {
    return false
  }

  if (study.isPublic) {
    if (await checkOrganization(user.organizationId, study.organizationId)) {
      return true
    }
  }

  const userRightsOnStudy = study.allowedUsers.find((right) => right.user.email === user.email)
  if (!userRightsOnStudy) {
    return false
  }

  return true
}
