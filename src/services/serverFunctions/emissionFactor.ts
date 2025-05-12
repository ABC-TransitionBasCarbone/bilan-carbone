'use server'

import { prismaClient } from '@/db/client'
import {
  createEmissionFactorWithParts,
  deleteEmissionFactorAndDependencies,
  getAllEmissionFactors,
  getAllEmissionFactorsByIds,
  getEmissionFactorById,
  getEmissionFactorDetailsById,
  updateEmissionFactor,
} from '@/db/emissionFactors'
import { getUserByEmail } from '@/db/userImport'
import { getLocale } from '@/i18n/locale'
import { flattenSubposts } from '@/utils/post'
import { EmissionFactorStatus, Import, Unit } from '@prisma/client'
import { auth } from '../auth'
import { NOT_AUTHORIZED } from '../permissions/check'
import { canCreateEmissionFactor } from '../permissions/emissionFactor'
import { canReadStudy } from '../permissions/study'
import { getStudyParentOrganization } from '../study'
import { sortAlphabetically } from '../utils'
import { EmissionFactorCommand, UpdateEmissionFactorCommand } from './emissionFactor.command'

export const getEmissionFactors = async (studyId?: string) => {
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
    const emissionFactorOrganizationId = await getStudyParentOrganization(studyId, session.user.organizationId)
    emissionFactors = await getAllEmissionFactors(emissionFactorOrganizationId, studyId)
  } else {
    emissionFactors = await getAllEmissionFactors(session.user.organizationId)
  }

  return emissionFactors
    .map((emissionFactor) => ({
      ...emissionFactor,
      metaData: emissionFactor.metaData.find((metadata) => metadata.language === locale),
    }))
    .sort((a, b) => sortAlphabetically(a?.metaData?.title, b?.metaData?.title))
}
export type EmissionFactorWithMetaData = AsyncReturnType<typeof getEmissionFactors>[0]

export const getEmissionFactorsByIds = async (ids: string[], studyId: string) => {
  try {
    const locale = await getLocale()

    const session = await auth()

    if (!session || !session.user.organizationId || !(await canReadStudy(session.user, studyId))) {
      return []
    }

    const emissionFactorOrganization = (await getStudyParentOrganization(
      studyId,
      session.user.organizationId,
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
}

export const getDetailedEmissionFactor = async (id: string) => {
  const [session, emissionFactor] = await Promise.all([auth(), getEmissionFactorDetailsById(id)])

  if (!emissionFactor || !session) {
    return null
  }

  if (!emissionFactor.organizationId || emissionFactor.organizationId !== session.user.organizationId) {
    return null
  }

  return emissionFactor
}

export const isFromEmissionFactorOrganization = async (id: string) => {
  const [session, emissionFactor] = await Promise.all([auth(), getEmissionFactorById(id)])

  if (!emissionFactor || !session || !session.user) {
    return false
  }
  return emissionFactor.organizationId === session.user.organizationId
}

export const createEmissionFactorCommand = async ({
  name,
  unit,
  attribute,
  comment,
  parts,
  subPosts,
  ...command
}: EmissionFactorCommand) => {
  const session = await auth()
  const local = await getLocale()
  if (!session || !session.user) {
    return NOT_AUTHORIZED
  }

  const user = await getUserByEmail(session.user.email)

  if (!user || !user.organizationId) {
    return NOT_AUTHORIZED
  }

  if (!canCreateEmissionFactor()) {
    return NOT_AUTHORIZED
  }

  await createEmissionFactorWithParts(
    {
      ...command,
      importedFrom: Import.Manual,
      status: EmissionFactorStatus.Valid,
      organization: { connect: { id: user.organizationId } },
      unit: unit as Unit,
      subPosts: flattenSubposts(subPosts),
      metaData: { create: { language: local, title: name, attribute, comment } },
    },
    parts,
    local,
  )
}

export const updateEmissionFactorCommand = async (command: UpdateEmissionFactorCommand) => {
  if (!isFromEmissionFactorOrganization(command.id)) {
    return NOT_AUTHORIZED
  }

  const [session, local] = await Promise.all([auth(), getLocale()])

  if (!session) {
    return NOT_AUTHORIZED
  }

  await updateEmissionFactor(session, local, command)
}

export const deleteEmissionFactor = async (id: string) => {
  if (!isFromEmissionFactorOrganization(id)) {
    return NOT_AUTHORIZED
  }

  await deleteEmissionFactorAndDependencies(id)
}

export const getEmissionFactorByImportedId = async (id: string) =>
  prismaClient.emissionFactor.findFirst({
    where: {
      importedId: id,
    },
    select: {
      id: true,
      versionId: true,
      importedId: true,
      unit: true,
      customUnit: true,
      version: { select: { id: true } },
      metaData: true,
    },
  })
