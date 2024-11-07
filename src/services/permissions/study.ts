import { getOrganizationById } from '@/db/organization'
import { Level, Prisma, Study, StudyRole, User as DbUser, Role } from '@prisma/client'
import { getAllowedLevels } from '../study'
import { getUserByEmail, getUserByEmailWithAllowedStudies, UserWithAllowedStudies } from '@/db/user'
import { User } from 'next-auth'
import { FullStudy } from '@/db/study'

const checkLevel = (userLevel: Level, studyLevel: Level) => getAllowedLevels(studyLevel).includes(userLevel)

const checkOrganization = async (userOrganizationId: string, organizationId: string) => {
  if (userOrganizationId === organizationId) {
    return true
  }

  const organization = await getOrganizationById(organizationId)
  if (organization && organization.childs.some((child) => child.id === userOrganizationId)) {
    return true
  }

  return false
}

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

  let allowedStudies: Exclude<UserWithAllowedStudies, null>['allowedStudies']
  if ('allowedStudies' in user) {
    allowedStudies = user.allowedStudies
  } else {
    const userWithAllowedStudies = await getUserByEmailWithAllowedStudies(user.email)
    if (!userWithAllowedStudies) {
      return false
    }
    allowedStudies = userWithAllowedStudies.allowedStudies
  }

  if (allowedStudies.every((allowedStudy) => allowedStudy.studyId !== study.id)) {
    return false
  }
  return true
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

export const canChangePublicStatus = async (user: User, study: FullStudy) => {
  if (user.role === Role.ADMIN) {
    return true
  }

  const userRightsOnStudy = study.allowedUsers.find((right) => right.user.email === user.email)
  if (!userRightsOnStudy || userRightsOnStudy.role === StudyRole.Reader) {
    return false
  }

  return true
}

export const canAddRightOnStudy = (user: User, study: FullStudy, newUser: DbUser, role: StudyRole) => {
  if (user.id === newUser.id) {
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
