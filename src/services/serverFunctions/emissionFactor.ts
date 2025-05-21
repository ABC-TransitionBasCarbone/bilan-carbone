'use server'

import { getAccountById } from '@/db/account'
import {
  createEmissionFactorWithParts,
  deleteEmissionFactorAndDependencies,
  findEmissionFactorByImportedId,
  getAllEmissionFactors,
  getAllEmissionFactorsByIds,
  getEmissionFactorById,
  getEmissionFactorDetailsById,
  getManualEmissionFactors,
  setEmissionFactorUnitAsCustom,
  updateEmissionFactor,
} from '@/db/emissionFactors'
import { getOrganizationVersionById } from '@/db/organization'
import { getLocale } from '@/i18n/locale'
import { unitsMatrix } from '@/services/importEmissionFactor/historyUnits'
import { ManualEmissionFactorUnitList } from '@/utils/emissionFactors'
import { flattenSubposts } from '@/utils/post'
import { IsSuccess, withServerResponse } from '@/utils/serverResponse'
import { EmissionFactorStatus, Import, Unit } from '@prisma/client'
import { auth } from '../auth'
import { NOT_AUTHORIZED } from '../permissions/check'
import { canCreateEmissionFactor } from '../permissions/emissionFactor'
import { canReadStudy } from '../permissions/study'
import { getStudyParentOrganizationVersionId } from '../study'
import { sortAlphabetically } from '../utils'
import { EmissionFactorCommand, UpdateEmissionFactorCommand } from './emissionFactor.command'

export const getEmissionFactors = async (studyId?: string) =>
  withServerResponse('getEmissionFactors', async () => {
    const session = await auth()
    if (!session || !session.user) {
      return []
    }

    const locale = await getLocale()
    let emissionFactors
    if (studyId) {
      if (!(await canReadStudy(session.user, studyId))) {
        return []
      }
      const organizationVersionId = await getStudyParentOrganizationVersionId(
        studyId,
        session.user.organizationVersionId,
      )
      const organizationVersion = await getOrganizationVersionById(organizationVersionId)
      if (!organizationVersion) {
        return []
      }
      const emissionFactorOrganizationId = organizationVersion.organizationId
      emissionFactors = await getAllEmissionFactors(emissionFactorOrganizationId, studyId)
    } else {
      const organizationVersion = await getOrganizationVersionById(session.user.organizationVersionId)
      if (!organizationVersion) {
        return []
      }
      emissionFactors = await getAllEmissionFactors(organizationVersion.organizationId)
    }

    return emissionFactors
      .map((emissionFactor) => ({
        ...emissionFactor,
        metaData: emissionFactor.metaData.find((metadata) => metadata.language === locale),
      }))
      .sort((a, b) => sortAlphabetically(a?.metaData?.title, b?.metaData?.title))
  })
export type EmissionFactorWithMetaData = IsSuccess<AsyncReturnType<typeof getEmissionFactors>>[number]

export const getEmissionFactorsByIds = async (ids: string[], studyId: string) =>
  withServerResponse('getEmissionFactorsByIds', async () => {
    try {
      const locale = await getLocale()

      const session = await auth()

      if (!session || !session.user.organizationVersionId || !(await canReadStudy(session.user, studyId))) {
        return []
      }

      const emissionFactorOrganization = (await getStudyParentOrganizationVersionId(
        studyId,
        session.user.organizationVersionId,
      )) as string

      const emissionFactors = await getAllEmissionFactorsByIds(ids, emissionFactorOrganization)

      return emissionFactors
        .map((emissionFactor) => ({
          ...emissionFactor,
          metaData: emissionFactor.metaData.find((metadata) => metadata.language === locale),
        }))
        .sort((a, b) => sortAlphabetically(a?.metaData?.title, b?.metaData?.title))
    } catch {
      return []
    }
  })

export const getDetailedEmissionFactor = async (id: string) =>
  withServerResponse('getDetailedEmissionFactor', async () => {
    const [session, emissionFactor] = await Promise.all([auth(), getEmissionFactorDetailsById(id)])

    if (!emissionFactor || !session) {
      return null
    }

    const organizationVersion = await getOrganizationVersionById(session.user.organizationVersionId)

    if (!emissionFactor.organizationId || emissionFactor.organizationId !== organizationVersion?.organizationId) {
      return null
    }

    return emissionFactor
  })

export const isFromEmissionFactorOrganization = async (id: string) =>
  withServerResponse('isFromEmissionFactorOrganization', async () => {
    const [session, emissionFactor] = await Promise.all([auth(), getEmissionFactorById(id)])

    if (!emissionFactor || !session || !session.user) {
      return false
    }
    return emissionFactor.organizationId === session.user.organizationId
  })

export const createEmissionFactorCommand = async ({
  name,
  unit,
  attribute,
  comment,
  parts,
  subPosts,
  ...command
}: EmissionFactorCommand) =>
  withServerResponse('createEmissionFactorCommand', async () => {
    const session = await auth()
    const local = await getLocale()
    if (!session || !session.user) {
      throw new Error(NOT_AUTHORIZED)
    }

    const account = await getAccountById(session.user.accountId)

    if (!account || !account.organizationVersionId) {
      throw new Error(NOT_AUTHORIZED)
    }

    if (!canCreateEmissionFactor()) {
      throw new Error(NOT_AUTHORIZED)
    }

    await createEmissionFactorWithParts(
      {
        ...command,
        importedFrom: Import.Manual,
        status: EmissionFactorStatus.Valid,
        organization: { connect: { id: account.organizationVersion?.organizationId } },
        unit: unit as Unit,
        subPosts: flattenSubposts(subPosts),
        metaData: { create: { language: local, title: name, attribute, comment } },
      },
      parts,
      local,
    )
  })

export const updateEmissionFactorCommand = async (command: UpdateEmissionFactorCommand) =>
  withServerResponse('updateEmissionFactorCommand', async () => {
    if (!isFromEmissionFactorOrganization(command.id)) {
      throw new Error(NOT_AUTHORIZED)
    }

    const [session, local] = await Promise.all([auth(), getLocale()])

    if (!session) {
      throw new Error(NOT_AUTHORIZED)
    }

    await updateEmissionFactor(session, local, command)
  })

export const deleteEmissionFactor = async (id: string) =>
  withServerResponse('deleteEmissionFactor', async () => {
    if (!isFromEmissionFactorOrganization(id)) {
      throw new Error(NOT_AUTHORIZED)
    }

    await deleteEmissionFactorAndDependencies(id)
  })

export const getEmissionFactorByImportedId = async (id: string) =>
  withServerResponse('getEmissionFactorByImportedId', async () => findEmissionFactorByImportedId(id))

export const fixUnits = async () => {
  const units = Object.values(Unit).filter((unit) => !ManualEmissionFactorUnitList.includes(unit))
  const emissionFactors = await getManualEmissionFactors(units)
  await Promise.all(
    emissionFactors.map((emissionFactor) => {
      const entry = Object.entries(unitsMatrix).find((entry) => entry[1] === emissionFactor.unit)
      return setEmissionFactorUnitAsCustom(emissionFactor.id, entry ? entry[0] : '')
    }),
  )
  console.log(`Fait : ${emissionFactors.length} facteurs mis à jour`)
}
