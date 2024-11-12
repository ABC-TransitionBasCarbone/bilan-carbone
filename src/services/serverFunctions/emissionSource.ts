'use server'

import { createEmissionSourceOnStudy } from '@/db/emissionSource'
import { CreateEmissionSourceCommand } from './emissionSource.command'
import { auth } from '../auth'
import { NOT_AUTHORIZED } from '../permissions/check'

export const createEmissionSource = async (command: CreateEmissionSourceCommand) => {
  const session = await auth()
  if (!session || !session.user) {
    return NOT_AUTHORIZED
  }
  //TODO: Manage authorization

  await createEmissionSourceOnStudy({
    name: command.name,
    subPost: command.subPost,
    study: { connect: { id: command.studyId } },
  })
}
