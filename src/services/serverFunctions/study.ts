'use server'

import { prismaClient } from '@/db/client'
import { getOrganizationById, getOrganizationWithSitesById } from '@/db/organization'
import {
  createContributorOnStudy,
  createStudy,
  createUserOnStudy,
  FullStudy,
  getStudyById,
  updateStudy,
  updateUserOnStudy,
} from '@/db/study'
import { addUser, getUserByEmail, OrganizationWithSites } from '@/db/user'
import {
  ControlMode,
  User as DBUser,
  Export,
  Import,
  Organization,
  Prisma,
  Role,
  StudyRole,
  SubPost,
} from '@prisma/client'
import { User } from 'next-auth'
import { auth } from '../auth'
import { NOT_AUTHORIZED } from '../permissions/check'
import {
  canAddContributorOnStudy,
  canAddRightOnStudy,
  canChangeDates,
  canChangeLevel,
  canChangePublicStatus,
  canCreateStudy,
} from '../permissions/study'
import { subPostsByPost } from '../posts'
import { getAllowedLevels } from '../study'
import {
  ChangeStudyDatesCommand,
  ChangeStudyLevelCommand,
  ChangeStudyPublicStatusCommand,
  CreateStudyCommand,
  NewStudyContributorCommand,
  NewStudyRightCommand,
} from './study.command'
import { sendContributorInvitation, sendNewContributorInvitation } from './user'

export const createStudyCommand = async ({
  organizationId,
  validator,
  sites,
  ...command
}: CreateStudyCommand): Promise<{ message: string; success: false } | { id: string; success: true }> => {
  const session = await auth()
  if (!session || !session.user) {
    return { success: false, message: NOT_AUTHORIZED }
  }

  const rights: Prisma.UserOnStudyCreateManyStudyInput[] = []
  if (validator === session.user.email) {
    rights.push({
      role: StudyRole.Validator,
      userId: session.user.id,
    })
  } else {
    const userValidator = await getUserByEmail(validator)
    if (!userValidator) {
      return { success: false, message: NOT_AUTHORIZED }
    }

    rights.push({
      role: StudyRole.Editor,
      userId: session.user.id,
    })
    rights.push({
      role: StudyRole.Validator,
      userId: userValidator.id,
    })
  }

  const activeVersion = await prismaClient.emissionFactorImportVersion.findFirst({
    where: { source: Import.BaseEmpreinte },
    orderBy: { createdAt: 'desc' },
  })
  if (!activeVersion) {
    return { success: false, message: `noActiveVersion_${Import.BaseEmpreinte}` }
  }

  const studySites = sites.filter((site) => site.selected)
  const organization = await getOrganizationWithSitesById(organizationId)
  if (!organization) {
    return { success: false, message: NOT_AUTHORIZED }
  }

  if (studySites.some((site) => organization.sites.every((organizationSite) => organizationSite.id !== site.id))) {
    return { success: false, message: NOT_AUTHORIZED }
  }

  const study = {
    ...command,
    createdBy: { connect: { id: session.user.id } },
    organization: { connect: { id: organizationId } },
    version: { connect: { id: activeVersion.id } },
    isPublic: command.isPublic === 'true',
    allowedUsers: {
      createMany: { data: rights },
    },
    exports: {
      createMany: {
        data: Object.entries(command.exports)
          .filter(([, value]) => value)
          .map(([key, value]) => ({
            type: key as Export,
            control: value as ControlMode,
          })),
      },
    },
    sites: {
      createMany: {
        data: studySites.map((site) => {
          const organizationSite = organization.sites.find(
            (organizationSite) => organizationSite.id === site.id,
          ) as OrganizationWithSites['sites'][0]
          return { siteId: site.id, etp: site.etp || organizationSite.etp, ca: site.ca || organizationSite.ca }
        }),
      },
    },
  } satisfies Prisma.StudyCreateInput

  if (!(await canCreateStudy(session.user, study, organizationId))) {
    return { success: false, message: NOT_AUTHORIZED }
  }

  try {
    const createdStudy = await createStudy(study)
    return { success: true, id: createdStudy.id }
  } catch (e) {
    console.error(e)
    return { success: false, message: 'default' }
  }
}

const getStudyRightsInformations = async (studyId: string) => {
  const session = await auth()
  if (!session || !session.user) {
    return null
  }

  const studyWithRights = await getStudyById(studyId, session.user.organizationId)

  if (!studyWithRights) {
    return null
  }
  return { user: session.user, studyWithRights }
}

export const changeStudyPublicStatus = async ({ studyId, ...command }: ChangeStudyPublicStatusCommand) => {
  const informations = await getStudyRightsInformations(studyId)
  if (informations === null) {
    return NOT_AUTHORIZED
  }
  if (!canChangePublicStatus(informations.user, informations.studyWithRights)) {
    return NOT_AUTHORIZED
  }
  await updateStudy(studyId, { isPublic: command.isPublic === 'true' })
}

export const changeStudyLevel = async ({ studyId, ...command }: ChangeStudyLevelCommand) => {
  const informations = await getStudyRightsInformations(studyId)
  if (informations === null) {
    return NOT_AUTHORIZED
  }

  if (!canChangeLevel(informations.user, informations.studyWithRights, command.level)) {
    return NOT_AUTHORIZED
  }
  await updateStudy(studyId, command)
}

export const changeStudyDates = async ({ studyId, ...command }: ChangeStudyDatesCommand) => {
  const informations = await getStudyRightsInformations(studyId)
  if (informations === null) {
    return NOT_AUTHORIZED
  }

  if (!canChangeDates(informations.user, informations.studyWithRights)) {
    return NOT_AUTHORIZED
  }
  await updateStudy(studyId, command)
}

const getUserOnStudy = async (
  email: string,
  study: FullStudy,
  organization: Organization,
  creator: User,
  newUser: DBUser | null,
) => {
  let userId = ''
  if (!newUser) {
    const newUser = await addUser({
      email: email,
      isActive: true,
      role: Role.DEFAULT,
      firstName: '',
      lastName: '',
    })
    await sendNewContributorInvitation(email, study, organization, creator)
    userId = newUser.id
  } else {
    if (newUser.organizationId !== organization.id) {
      await sendContributorInvitation(email, study, organization, creator, newUser)
    }
    userId = newUser.id
  }
  return userId
}

export const newStudyRight = async (right: NewStudyRightCommand) => {
  const session = await auth()
  if (!session || !session.user) {
    return NOT_AUTHORIZED
  }

  const [studyWithRights, newUser] = await Promise.all([
    getStudyById(right.studyId, session.user.organizationId),
    getUserByEmail(right.email),
  ])

  if (!studyWithRights) {
    return NOT_AUTHORIZED
  }

  const organization = await getOrganizationById(studyWithRights.organizationId)
  if (!organization) {
    return NOT_AUTHORIZED
  }

  if (!newUser || !getAllowedLevels(newUser.level).includes(studyWithRights.level)) {
    right.role = StudyRole.Reader
  }

  if (!canAddRightOnStudy(session.user, studyWithRights, newUser, right.role)) {
    return NOT_AUTHORIZED
  }

  const userId = await getUserOnStudy(right.email, studyWithRights, organization, session.user, newUser)
  await createUserOnStudy({
    user: { connect: { id: userId } },
    study: { connect: { id: studyWithRights.id } },
    role: right.role,
  })
}

export const changeStudyRole = async (studyId: string, email: string, studyRole: StudyRole) => {
  const session = await auth()
  if (!session || !session.user) {
    return NOT_AUTHORIZED
  }

  const [studyWithRights, user] = await Promise.all([
    getStudyById(studyId, session.user.organizationId),
    getUserByEmail(email),
  ])

  if (!studyWithRights || !user) {
    return NOT_AUTHORIZED
  }

  if (!canAddRightOnStudy(session.user, studyWithRights, user, studyRole)) {
    return NOT_AUTHORIZED
  }

  await updateUserOnStudy(user.id, studyWithRights.id, studyRole)
}

export const newStudyContributor = async ({ email, post, subPost, ...command }: NewStudyContributorCommand) => {
  const session = await auth()
  if (!session || !session.user) {
    return NOT_AUTHORIZED
  }

  const [studyWithRights, newUser] = await Promise.all([
    getStudyById(command.studyId, session.user.organizationId),
    getUserByEmail(email),
  ])

  if (!studyWithRights) {
    return NOT_AUTHORIZED
  }

  const organization = await getOrganizationById(studyWithRights.organizationId)
  if (!organization) {
    return NOT_AUTHORIZED
  }

  if (!canAddContributorOnStudy(session.user, studyWithRights)) {
    return NOT_AUTHORIZED
  }

  const userId = await getUserOnStudy(email, studyWithRights, organization, session.user, newUser)

  if (post === 'all') {
    await createContributorOnStudy(userId, Object.values(SubPost), command)
  } else if (!subPost || subPost === 'all') {
    await createContributorOnStudy(userId, subPostsByPost[post], command)
  } else {
    await createContributorOnStudy(userId, [subPost], command)
  }
}
