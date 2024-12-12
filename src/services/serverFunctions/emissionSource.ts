'use server'

import {
  createEmissionSourceOnStudy,
  deleteEmissionSourceOnStudy,
  getEmissionSourceById,
  updateEmissionSourceOnStudy,
} from '@/db/emissionSource'
import { getStudyById } from '@/db/study'
import { getUserByEmail } from '@/db/user'
import { auth } from '../auth'
import { NOT_AUTHORIZED } from '../permissions/check'
import {
  canCreateEmissionSource,
  canDeleteEmissionSource,
  canUpdateEmissionSource,
} from '../permissions/emissionSource'
import { CreateEmissionSourceCommand, UpdateEmissionSourceCommand } from './emissionSource.command'

export const createEmissionSource = async ({ studyId, siteId, ...command }: CreateEmissionSourceCommand) => {
  const session = await auth()
  if (!session || !session.user) {
    return NOT_AUTHORIZED
  }

  const user = await getUserByEmail(session.user.email)
  if (!user) {
    return NOT_AUTHORIZED
  }

  if (!(await canCreateEmissionSource(user, { studyId, siteId, ...command }))) {
    return NOT_AUTHORIZED
  }

  await createEmissionSourceOnStudy({
    ...command,
    site: { connect: { id: siteId } },
    study: { connect: { id: studyId } },
  })
}

export const updateEmissionSource = async ({
  emissionSourceId,
  emissionFactorId,
  ...command
}: UpdateEmissionSourceCommand) => {
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
  const data = { ...command, emissionFactor: emissionFactorId ? { connect: { id: emissionFactorId } } : undefined }

  const study = await getStudyById(emissionSource.studyId)
  if (!study || !(await canUpdateEmissionSource(user, emissionSource, data, study))) {
    return NOT_AUTHORIZED
  }

  const isContributor = study.contributors.some(
    (contributor) => contributor.user.email === user.email && contributor.subPost === emissionSource.subPost,
  )
  await updateEmissionSourceOnStudy(
    emissionSourceId,
    isContributor ? { ...data, contributor: { connect: { id: user.id } } } : data,
  )
}

export const deleteEmissionSource = async (emissionSourceId: string) => {
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
  const study = await getStudyById(emissionSource.studyId)

  if (!study || !(await canDeleteEmissionSource(user, study))) {
    return NOT_AUTHORIZED
  }

  await deleteEmissionSourceOnStudy(emissionSourceId)
}
