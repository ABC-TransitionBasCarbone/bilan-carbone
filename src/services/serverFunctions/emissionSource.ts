// TO DELETE ts-nockeck
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
'use server'

import { getAccountById } from '@/db/account'
import { getEmissionFactorById } from '@/db/emissionFactors'
import {
  createEmissionSourceOnStudy,
  deleteEmissionSourceOnStudy,
  getEmissionSourceById,
  updateEmissionSourceOnStudy,
} from '@/db/emissionSource'
import { getStudyById } from '@/db/study'
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

  const account = await getAccountById(session.user.accountId)
  if (!account) {
    return NOT_AUTHORIZED
  }

  if (!(await canCreateEmissionSource(account, { studyId, studySiteId, ...command }))) {
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

  const [account, emissionSource, emissionFactor] = await Promise.all([
    getAccountById(session.user.accountId),
    getEmissionSourceById(emissionSourceId),
    emissionFactorId ? getEmissionFactorById(emissionFactorId) : undefined,
  ])
  if (!account || !emissionSource) {
    return NOT_AUTHORIZED
  }

  const study = await getStudyById(emissionSource.studyId, account.organizationId)
  if (!study || !(await canUpdateEmissionSource(account, emissionSource, command, study))) {
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
    (contributor) =>
      contributor.account.user.email === account.user.email && contributor.subPost === emissionSource.subPost,
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
    isContributor ? { ...data, contributor: { connect: { id: account.id } } } : data,
  )
  addUserChecklistItem(UserChecklist.CreateFirstEmissionSource)
}

export const deleteEmissionSource = async (emissionSourceId: string) => {
  const session = await auth()
  if (!session || !session.user) {
    return NOT_AUTHORIZED
  }

  const [account, emissionSource] = await Promise.all([
    getAccountById(session.user.accountId),
    getEmissionSourceById(emissionSourceId),
  ])
  if (!account || !emissionSource) {
    return NOT_AUTHORIZED
  }
  const study = await getStudyById(emissionSource.studyId, account.organizationId)

  if (!study || !(await canDeleteEmissionSource(account, study))) {
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
