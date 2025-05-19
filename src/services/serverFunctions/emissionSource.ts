// TO DELETE ts-nockeck
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
'use server'

import { getEmissionFactorById } from '@/db/emissionFactors'
import {
  createEmissionSourceOnStudy,
  deleteEmissionSourceOnStudy,
  getEmissionSourceById,
  updateEmissionSourceOnStudy,
} from '@/db/emissionSource'
import { getStudyById } from '@/db/study'
import { getUserByEmail } from '@/db/userImport'
import { UserChecklist } from '@prisma/client'
import { auth } from '../auth'
import { NOT_AUTHORIZED } from '../permissions/check'
import {
  canCreateEmissionSource,
  canDeleteEmissionSource,
  canUpdateEmissionSource,
} from '../permissions/emissionSource'
import { CreateEmissionSourceCommand, UpdateEmissionSourceCommand } from './emissionSource.command'
import { addUserChecklistItem } from './user'

export const createEmissionSource = async ({
  studyId,
  studySiteId,
  emissionFactorId,
  ...command
}: CreateEmissionSourceCommand) => {
  const session = await auth()
  if (!session || !session.user) {
    return NOT_AUTHORIZED
  }

  const user = await getUserByEmail(session.user.email)
  if (!user) {
    return NOT_AUTHORIZED
  }

  if (!(await canCreateEmissionSource(user, { studyId, studySiteId, ...command }))) {
    return NOT_AUTHORIZED
  }

  const [study, emissionFactor] = await Promise.all([
    getStudyById(studyId, user.organizationId),
    emissionFactorId ? getEmissionFactorById(emissionFactorId) : undefined,
  ])

  if (
    emissionFactor?.version?.id &&
    !study?.emissionFactorVersions
      .map((emissionFactorVersion) => emissionFactorVersion.importVersionId)
      .includes(emissionFactor.version.id)
  ) {
    return NOT_AUTHORIZED
  }

  return await createEmissionSourceOnStudy({
    ...command,
    ...(emissionFactorId ? { emissionFactor: { connect: { id: emissionFactorId } } } : {}),
    studySite: { connect: { id: studySiteId } },
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

  const [user, emissionSource, emissionFactor] = await Promise.all([
    getUserByEmail(session.user.email),
    getEmissionSourceById(emissionSourceId),
    emissionFactorId ? getEmissionFactorById(emissionFactorId) : undefined,
  ])
  if (!user || !emissionSource) {
    return NOT_AUTHORIZED
  }

  const study = await getStudyById(emissionSource.studyId, user.organizationId)
  if (!study || !(await canUpdateEmissionSource(user, emissionSource, command, study))) {
    return NOT_AUTHORIZED
  }

  if (
    emissionFactor?.version?.id &&
    !study.emissionFactorVersions
      .map((emissionFactorVersion) => emissionFactorVersion.importVersionId)
      .includes(emissionFactor.version.id)
  ) {
    return NOT_AUTHORIZED
  }
  const isContributor = study.contributors.some(
    (contributor) => contributor.user.email === user.email && contributor.subPost === emissionSource.subPost,
  )

  const data = {
    ...command,
    ...(emissionFactorId !== undefined
      ? {
          emissionFactorId,
          feReliability: null,
          feTechnicalRepresentativeness: null,
          feGeographicRepresentativeness: null,
          feTemporalRepresentativeness: null,
          feCompleteness: null,
        }
      : {}),
  }

  await updateEmissionSourceOnStudy(
    emissionSourceId,
    isContributor ? { ...data, contributor: { connect: { id: user.id } } } : data,
  )
  addUserChecklistItem(UserChecklist.CreateFirstEmissionSource)
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
  const study = await getStudyById(emissionSource.studyId, user.organizationId)

  if (!study || !(await canDeleteEmissionSource(user, study))) {
    return NOT_AUTHORIZED
  }

  await deleteEmissionSourceOnStudy(emissionSourceId)
}

export const getEmissionSourcesByStudyId = async (studyId: string) => {
  const session = await auth()
  if (!session || !session.user) {
    return []
  }

  const user = await getUserByEmail(session.user.email)
  if (!user) {
    return []
  }

  const study = await getStudyById(studyId, user.organizationId)
  if (!study) {
    return []
  }

  return study.emissionSources
}
