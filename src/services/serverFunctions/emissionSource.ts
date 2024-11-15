'use server'

import { createEmissionSourceOnStudy, getEmissionSourceById, updateEmissionSourceOnStudy } from '@/db/emissionSource'
import { CreateEmissionSourceCommand, UpdateEmissionSourceCommand } from './emissionSource.command'
import { auth } from '../auth'
import { NOT_AUTHORIZED } from '../permissions/check'
import { canCreateEmissionSource, canUpdateEmissionSource } from '../permissions/emissionSource'
import { getUserByEmail } from '@/db/user'

export const createEmissionSource = async (command: CreateEmissionSourceCommand) => {
  const session = await auth()
  if (!session || !session.user) {
    return NOT_AUTHORIZED
  }

  const user = await getUserByEmail(session.user.email)
  if (!user) {
    return NOT_AUTHORIZED
  }

  if (!(await canCreateEmissionSource(user, { studyId: command.studyId, subPost: command.subPost }))) {
    return NOT_AUTHORIZED
  }

  await createEmissionSourceOnStudy({
    name: command.name,
    subPost: command.subPost,
    study: { connect: { id: command.studyId } },
  })
}

export const updateEmissionSource = async ({ emissionSourceId, ...command }: UpdateEmissionSourceCommand) => {
  const session = await auth()
  if (!session || !session.user) {
    return NOT_AUTHORIZED
  }

  const [user, emissionSource] = await Promise.all([
    getUserByEmail(session.user.email),
    getEmissionSourceById(emissionSourceId),
  ])
  if (!user || !emissionSource) {
    return NOT_AUTHORIZED
  }

  if (!(await canUpdateEmissionSource(user, emissionSource, command))) {
    return NOT_AUTHORIZED
  }

  await updateEmissionSourceOnStudy(emissionSourceId, command)
}
