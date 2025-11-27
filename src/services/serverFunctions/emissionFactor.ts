'use server'

import { getAccountById } from '@/db/account'
import { prismaClient } from '@/db/client'
import {
  createEmissionFactorWithParts,
  deleteEmissionFactorAndDependencies,
  findEmissionFactorByImportedId,
  getAllEmissionFactors,
  getAllEmissionFactorsByIds,
  getAllEmissionFactorsLocations,
  getEmissionFactorById,
  getEmissionFactorDetailsById,
  getEmissionFactorImportVersionsBC,
  getEmissionFactorImportVersionsCUT,
  getManualEmissionFactors,
  setEmissionFactorUnitAsCustom,
  updateEmissionFactor,
} from '@/db/emissionFactors'
import { getOrganizationVersionById, getOrganizationVersionByOrganizationIdAndEnvironment } from '@/db/organization'
import { getStudyById } from '@/db/study'
import { getLocale } from '@/i18n/locale'
import { unitsMatrix } from '@/services/importEmissionFactor/historyUnits'
import { FeFilters } from '@/types/filters'
import { ManualEmissionFactorUnitList } from '@/utils/emissionFactors'
import { hasActiveLicence } from '@/utils/organization'
import { flattenSubposts } from '@/utils/post'
import { IsSuccess, withServerResponse } from '@/utils/serverResponse'
import { EmissionFactorStatus, Environment, Import, Unit } from '@prisma/client'
import { auth, dbActualizedAuth } from '../auth'
import { NOT_AUTHORIZED } from '../permissions/check'
import { canCreateEmissionFactor } from '../permissions/emissionFactor'
import { canReadStudy } from '../permissions/study'
import { getStudyParentOrganizationVersionId } from '../study'
import { sortAlphabetically } from '../utils'
import { EmissionFactorCommand, UpdateEmissionFactorCommand } from './emissionFactor.command'

export const getFELocations = async () => {
  const session = await auth()
  if (!session || !session.user) {
    return []
  }
  const locale = await getLocale()
  return prismaClient.emissionFactorMetaData.findMany({
    where: {
      language: locale,
      location: { not: null },
      emissionFactor: {
        subPosts: { isEmpty: false },
        OR: [
          { organizationId: session.user.organizationId },
          { AND: [{ versionId: { not: null }, version: { source: { not: Import.CUT } } }] },
        ],
      },
    },
    distinct: ['location'],
    select: { location: true },
  }) as Promise<{ location: string }[]>
}
export const getEmissionFactors = async (
  skip: number,
  take: number | 'ALL',
  filters: FeFilters,
  environment: Environment,
  studyId?: string,
) =>
  withServerResponse('getEmissionFactors', async () => {
    const session = await auth()
    if (!session || !session.user) {
      return { emissionFactors: [], count: 0 }
    }

    const locale = await getLocale()
    if (studyId) {
      if (!(await canReadStudy(session.user, studyId))) {
        return { emissionFactors: [], count: 0 }
      }
      const organizationVersionId = await getStudyParentOrganizationVersionId(
        studyId,
        session.user.organizationVersionId,
      )
      const organizationVersion = await getOrganizationVersionById(organizationVersionId)
      if (!organizationVersion) {
        return { emissionFactors: [], count: 0 }
      }
      const emissionFactorOrganizationId = organizationVersion.organizationId
      return getAllEmissionFactors(emissionFactorOrganizationId, skip, take, locale, filters, environment)
    } else {
      const organizationVersion = await getOrganizationVersionById(session.user.organizationVersionId)
      return getAllEmissionFactors(organizationVersion?.organizationId, skip, take, locale, filters, environment)
    }
  })
export type EmissionFactorWithMetaData = IsSuccess<
  AsyncReturnType<typeof getEmissionFactors>
>['emissionFactors'][number]

const getStudyOrganization = async (studyId: string, organizationVersionId: string) => {
  const study = await getStudyById(studyId, organizationVersionId)
  if (!study) {
    throw Error("Study doesn't exist")
  }

  const orgaVersion = study.organizationVersion.parentId || study.organizationVersion.id

  const organization = await getOrganizationVersionById(orgaVersion)
  if (!organization) {
    throw Error("Organization doesn't exist")
  }

  return organization.organizationId
}

export const getEmissionFactorsByIds = async (ids: string[], studyId: string) =>
  withServerResponse('getEmissionFactorsByIds', async () => {
    try {
      const locale = await getLocale()

      const session = await auth()

      if (!session || !session.user.organizationVersionId || !(await canReadStudy(session.user, studyId))) {
        return []
      }

      const emissionFactorOrganization = (await getStudyOrganization(
        studyId,
        session.user.organizationVersionId,
      )) as string

      const emissionFactors = await getAllEmissionFactorsByIds(ids, emissionFactorOrganization)

      return emissionFactors
        .map((emissionFactor) => ({
          ...emissionFactor,
          metaData: emissionFactor.metaData.find((metadata) => metadata.language === locale),
        }))
        .filter((emissionFactor) => emissionFactor.metaData)
        .sort((a, b) => sortAlphabetically(a?.metaData?.title, b?.metaData?.title)) as EmissionFactorWithMetaData[]
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

export const getEmissionFactorLocations = async () =>
  withServerResponse('getEmissionFactorLocations', async () => {
    const session = await auth()

    if (!session) {
      return []
    }

    return getAllEmissionFactorsLocations()
  })

export const isFromEmissionFactorOrganization = async (id: string) =>
  withServerResponse('isFromEmissionFactorOrganization', async () => {
    const [session, emissionFactor] = await Promise.all([dbActualizedAuth(), getEmissionFactorById(id)])

    if (!emissionFactor || !session || !session.user) {
      return false
    }
    return emissionFactor.organizationId === session.user.organizationId
  })

export const isEmissionFactorFromActiveOrganization = async (id: string) =>
  withServerResponse('isEmissionFactorFromActiveOrganization', async () => {
    const [session, emissionFactor] = await Promise.all([dbActualizedAuth(), getEmissionFactorById(id)])

    if (!emissionFactor || !emissionFactor.organizationId || !session || !session.user) {
      return false
    }
    const organizationVersion = await getOrganizationVersionByOrganizationIdAndEnvironment(
      emissionFactor.organizationId,
      session.user.environment,
    )
    if (!organizationVersion || (!hasActiveLicence(organizationVersion) && organizationVersion.environment !== Environment.CUT)) {
      return false
    }
    return true
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

    if (!(await canCreateEmissionFactor(account.organizationVersionId))) {
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

    if (!(await isEmissionFactorFromActiveOrganization(command.id))) {
      throw new Error(NOT_AUTHORIZED)
    }

    await updateEmissionFactor(session, local, command)
  })

export const deleteEmissionFactor = async (id: string) =>
  withServerResponse('deleteEmissionFactor', async () => {
    if (!isFromEmissionFactorOrganization(id)) {
      throw new Error(NOT_AUTHORIZED)
    }

    if (!(await isEmissionFactorFromActiveOrganization(id))) {
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
}

export const getEmissionFactorImportVersions = async (withArchived: boolean = false) =>
  withServerResponse('getEmissionFactorImportVersions', async () => {
    const session = await auth()
    if (!session || !session.user) {
      throw new Error(NOT_AUTHORIZED)
    }

    if (!session.user) {
      throw new Error(NOT_AUTHORIZED)
    }

    switch (session.user.environment) {
      case Environment.CUT:
        return getEmissionFactorImportVersionsCUT()
      case Environment.BC:
      default:
        return getEmissionFactorImportVersionsBC(withArchived)
    }
  })
