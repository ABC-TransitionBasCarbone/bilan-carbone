'use server'

import {
  ChangeStudyLevelCommand,
  ChangeStudyPublicStatusCommand,
  CreateStudyCommand,
  NewStudyContributorCommand,
  NewStudyRightCommand,
} from './study.command'
import { auth } from '../auth'
import { prismaClient } from '@/db/client'
import {
  createContributorOnStudy,
  createStudy,
  createUserOnStudy,
  getStudyById,
  updateStudy,
  updateUserOnStudy,
} from '@/db/study'
import { ControlMode, Export, Import, Prisma, StudyRole, SubPost } from '@prisma/client'
import { NOT_AUTHORIZED } from '../permissions/check'
import {
  canAddContributorOnStudy,
  canAddRightOnStudy,
  canChangeLevel,
  canChangePublicStatus,
  canCreateStudy,
} from '../permissions/study'
import { getUserByEmail } from '@/db/user'
import { subPostsByPost } from '../posts'

export const createStudyCommand = async ({
  organizationId,
  validator,
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

export const changeStudyPublicStatus = async (command: ChangeStudyPublicStatusCommand) => {
  const session = await auth()
  if (!session || !session.user) {
    return NOT_AUTHORIZED
  }

  const studyWithRights = await getStudyById(command.studyId)

  if (!studyWithRights) {
    return NOT_AUTHORIZED
  }

  if (!canChangePublicStatus(session.user, studyWithRights)) {
    return NOT_AUTHORIZED
  }
  await updateStudy(command.studyId, { isPublic: command.isPublic === 'true' })
}

export const changeStudyLevel = async (command: ChangeStudyLevelCommand) => {
  const session = await auth()
  if (!session || !session.user) {
    return NOT_AUTHORIZED
  }

  const studyWithRights = await getStudyById(command.studyId)

  if (!studyWithRights) {
    return NOT_AUTHORIZED
  }

  if (!canChangeLevel(session.user, studyWithRights, command.level)) {
    return NOT_AUTHORIZED
  }
  await updateStudy(command.studyId, { level: command.level })
}

export const newStudyRight = async (right: NewStudyRightCommand) => {
  const session = await auth()
  if (!session || !session.user) {
    return NOT_AUTHORIZED
  }

  const [studyWithRights, newUser] = await Promise.all([getStudyById(right.studyId), getUserByEmail(right.email)])

  if (!studyWithRights || !newUser) {
    return NOT_AUTHORIZED
  }

  if (!canAddRightOnStudy(session.user, studyWithRights, newUser, right.role)) {
    return NOT_AUTHORIZED
  }

  await createUserOnStudy({
    user: { connect: { id: newUser.id } },
    study: { connect: { id: studyWithRights.id } },
    role: right.role,
  })
}

export const changeStudyRole = async (studyId: string, email: string, studyRole: StudyRole) => {
  const session = await auth()
  if (!session || !session.user) {
    return NOT_AUTHORIZED
  }

  const [studyWithRights, user] = await Promise.all([getStudyById(studyId), getUserByEmail(email)])

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

  const [studyWithRights, user] = await Promise.all([getStudyById(command.studyId), getUserByEmail(email)])

  if (!studyWithRights || !user) {
    return NOT_AUTHORIZED
  }

  if (!canAddContributorOnStudy(session.user, studyWithRights)) {
    return NOT_AUTHORIZED
  }

  if (post === 'all') {
    await createContributorOnStudy(user.id, Object.values(SubPost), command)
  } else if (!subPost || subPost === 'all') {
    await createContributorOnStudy(user.id, subPostsByPost[post], command)
  } else {
    await createContributorOnStudy(user.id, [subPost], command)
  }
}
