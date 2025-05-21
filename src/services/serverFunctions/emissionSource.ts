'use server'

import { AccountWithUser, getAccountById } from '@/db/account'
import { getEmissionFactorById } from '@/db/emissionFactors'
import {
  createEmissionSourceOnStudy,
  deleteEmissionSourceOnStudy,
  getEmissionSourceById,
  updateEmissionSourceOnStudy,
} from '@/db/emissionSource'
import { getStudyById } from '@/db/study'
import { withServerResponse } from '@/utils/serverResponse'
import { Import, UserChecklist } from '@prisma/client'
import { auth } from '../auth'
import { NOT_AUTHORIZED } from '../permissions/check'
import {
  canCreateEmissionSource,
  canDeleteEmissionSource,
  canUpdateEmissionSource,
} from '../permissions/emissionSource'
import { isInOrgaOrParentFromId } from '../permissions/organization'
import { CreateEmissionSourceCommand, UpdateEmissionSourceCommand } from './emissionSource.command'
import { addUserChecklistItem } from './user'

export const createEmissionSource = async ({
  studyId,
  studySiteId,
  emissionFactorId,
  ...command
}: CreateEmissionSourceCommand) =>
  withServerResponse('createEmissionSource', async () => {
    const session = await auth()
    if (!session || !session.user) {
      throw new Error(NOT_AUTHORIZED)
    }

    const account = await getAccountById(session.user.accountId)
    if (!account) {
      throw new Error(NOT_AUTHORIZED)
    }

    if (!(await canCreateEmissionSource(account as AccountWithUser, { studyId, studySiteId, ...command }))) {
      throw new Error(NOT_AUTHORIZED)
    }

    const [study, emissionFactor] = await Promise.all([
      getStudyById(studyId, account.organizationVersionId),
      emissionFactorId ? getEmissionFactorById(emissionFactorId) : undefined,
    ])

    if (
      emissionFactor?.version?.id &&
      !study?.emissionFactorVersions
        .map((emissionFactorVersion) => emissionFactorVersion.importVersionId)
        .includes(emissionFactor.version.id)
    ) {
      throw new Error(NOT_AUTHORIZED)
    }

    return await createEmissionSourceOnStudy({
      ...command,
      ...(emissionFactorId ? { emissionFactor: { connect: { id: emissionFactorId } } } : {}),
      studySite: { connect: { id: studySiteId } },
      study: { connect: { id: studyId } },
    })
  })

export const updateEmissionSource = async ({
  emissionSourceId,
  emissionFactorId,
  ...command
}: UpdateEmissionSourceCommand) =>
  withServerResponse('updateEmissionSource', async () => {
    const session = await auth()
    if (!session || !session.user) {
      throw new Error(NOT_AUTHORIZED)
    }

    const [account, emissionSource, emissionFactor] = await Promise.all([
      getAccountById(session.user.accountId),
      getEmissionSourceById(emissionSourceId),
      emissionFactorId ? getEmissionFactorById(emissionFactorId) : undefined,
    ])
    if (!account || !emissionSource) {
      throw new Error(NOT_AUTHORIZED)
    }

    const study = await getStudyById(emissionSource.studyId, account.organizationVersionId)
    if (!study || !(await canUpdateEmissionSource(account as AccountWithUser, emissionSource, command, study))) {
      throw new Error(NOT_AUTHORIZED)
    }

    if (
      emissionFactor?.version?.id &&
      !study.emissionFactorVersions
        .map((emissionFactorVersion) => emissionFactorVersion.importVersionId)
        .includes(emissionFactor.version.id)
    ) {
      throw new Error(NOT_AUTHORIZED)
    }

    if (
      emissionFactor?.importedFrom === Import.Manual &&
      emissionFactor.organizationId &&
      !(await isInOrgaOrParentFromId(emissionFactor.organizationId, study.organizationVersion.organization.id))
    ) {
      throw new Error(NOT_AUTHORIZED)
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
  })

export const deleteEmissionSource = async (emissionSourceId: string) =>
  withServerResponse('deleteEmissionSource', async () => {
    const session = await auth()
    if (!session || !session.user) {
      throw new Error(NOT_AUTHORIZED)
    }

    const [account, emissionSource] = await Promise.all([
      getAccountById(session.user.accountId),
      getEmissionSourceById(emissionSourceId),
    ])
    if (!account || !emissionSource) {
      throw new Error(NOT_AUTHORIZED)
    }
    const study = await getStudyById(emissionSource.studyId, account.organizationVersionId)

    if (!study || !(await canDeleteEmissionSource(account as AccountWithUser, study))) {
      throw new Error(NOT_AUTHORIZED)
    }

    await deleteEmissionSourceOnStudy(emissionSourceId)
  })

export const getEmissionSourcesByStudyId = async (studyId: string) =>
  withServerResponse('', async () => {
    const session = await auth()
    if (!session || !session.user) {
      return []
    }

    const account = await getAccountById(session.user.accountId)
    if (!account) {
      return []
    }

    const study = await getStudyById(studyId, account.organizationVersionId)
    if (!study) {
      return []
    }

    return study.emissionSources
  })
