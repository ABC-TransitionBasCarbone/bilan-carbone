'use server'

import { CreateStudyCommand, NewStudyRightCommand } from './study.command'
import { auth } from '../auth'
import { createStudy, createUserOnStudy, getStudyWithRightsById, updateUserOnStudy } from '@/db/study'
import { ControlMode, Export, Prisma, StudyRole } from '@prisma/client'
import dayjs from 'dayjs'
import { NOT_AUTHORIZED } from '../permissions/check'
import { canAddRightOnStudy, canCreateStudy } from '../permissions/study'
import { getUserByEmail } from '@/db/user'

export const createStudyCommand = async ({ organizationId, ...command }: CreateStudyCommand) => {
  const session = await auth()
  if (!session || !session.user) {
    return NOT_AUTHORIZED
  }
  const study = {
    ...command,
    createdBy: { connect: { id: session.user.id } },
    startDate: dayjs(command.startDate).toDate(),
    endDate: dayjs(command.endDate).toDate(),
    organization: { connect: { id: organizationId } },
    allowedUsers: {
      create: {
        role: 'Editor',
        user: {
          connect: {
            id: session.user.id,
          },
        },
      },
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
    return NOT_AUTHORIZED
  }

  try {
    await createStudy(study)
  } catch (e) {
    console.error(e)
    return 'Something went wrong...'
  }
}

export const newStudyRight = async (right: NewStudyRightCommand) => {
  const session = await auth()
  if (!session || !session.user) {
    return NOT_AUTHORIZED
  }

  const [studyWithRights, newUser] = await Promise.all([
    getStudyWithRightsById(right.studyId),
    getUserByEmail(right.email),
  ])

  if (!studyWithRights || !newUser) {
    return NOT_AUTHORIZED
  }

  if (!(await canAddRightOnStudy(session.user, studyWithRights, newUser, right.role))) {
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

  const [studyWithRights, user] = await Promise.all([getStudyWithRightsById(studyId), getUserByEmail(email)])
  if (!studyWithRights || !user) {
    return NOT_AUTHORIZED
  }

  if (!(await canAddRightOnStudy(session.user, studyWithRights, user, studyRole))) {
    return NOT_AUTHORIZED
  }

  await updateUserOnStudy(user.id, studyWithRights.id, studyRole)
}
