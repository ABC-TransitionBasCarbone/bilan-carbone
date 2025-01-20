'use server'

import { prismaClient } from '@/db/client'
import {
  createEmissionFactor,
  getEmissionFactorById,
  getEmissionFactorDetailsById,
  updateEmissionFactor,
} from '@/db/emissionFactors'
import { getUserByEmail } from '@/db/user'
import { getLocale } from '@/i18n/locale'
import { EmissionFactorStatus, Import, Unit } from '@prisma/client'
import { auth } from '../auth'
import { getEmissionFactors, getEmissionFactorsByIds } from '../emissionFactors'
import { NOT_AUTHORIZED } from '../permissions/check'
import { canCreateEmissionFactor } from '../permissions/emissionFactor'
import { CreateEmissionFactorCommand, UpdateEmissionFactorCommand } from './emissionFactor.command'

export const getEmissionsFactor = async () => {
  const locale = await getLocale()
  return getEmissionFactors(locale)
}

export const getEmissionFactorByIds = async (ids: string[]) => {
  const locale = await getLocale()
  return getEmissionFactorsByIds(ids, locale)
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

export const canEditEmissionFactor = async (id: string) => {
  const [session, emissionFactor] = await Promise.all([auth(), getEmissionFactorById(id)])

  if (!emissionFactor || !session) {
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
  subPost,
  ...command
}: CreateEmissionFactorCommand) => {
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

  const emissionFactor = await createEmissionFactor({
    ...command,
    importedFrom: Import.Manual,
    status: EmissionFactorStatus.Valid,
    reliability: 5,
    organization: { connect: { id: user.organizationId } },
    unit: unit as Unit,
    subPosts: [subPost],
    metaData: {
      create: {
        language: local,
        title: name,
        attribute,
        comment,
      },
    },
  })

  await Promise.all(
    parts.map(({ name, ...part }) =>
      prismaClient.emissionFactorPart.create({
        data: {
          emissionFactorId: emissionFactor.id,
          ...part,
          metaData: {
            create: {
              language: local,
              title: name,
            },
          },
        },
      }),
    ),
  )
}

export const updateEmissionFactorCommand = async ({
  id,
  name,
  unit,
  attribute,
  comment,
  parts,
  subPost,
  ...command
}: UpdateEmissionFactorCommand) => {
  if (!canEditEmissionFactor(id)) {
    return NOT_AUTHORIZED
  }

  const [session, local] = await Promise.all([auth(), getLocale()])

  await prismaClient.$transaction(async (transaction) => {
    await updateEmissionFactor(transaction, id, {
      ...command,
      importedFrom: Import.Manual,
      status: EmissionFactorStatus.Valid,
      reliability: 5,
      organization: { connect: { id: session?.user.organizationId as string } },
      unit: unit as Unit,
      subPosts: [subPost],
    })

    await transaction.emissionFactorMetaData.upsert({
      where: {
        emissionFactorId_language: { emissionFactorId: id, language: local },
      },
      create: { emissionFactorId: id, language: local, title: name, attribute, comment },
      update: { language: local, title: name, attribute, comment },
    })
    const emissionFactorParts = await transaction.emissionFactorPart.findMany({
      where: { emissionFactorId: id },
      select: { id: true },
    })
    const emissionFactorPartIds = emissionFactorParts.map((emissionFactorPart) => emissionFactorPart.id)
    await transaction.emissionFactorPartMetaData.deleteMany({
      where: { emissionFactorPartId: { in: emissionFactorPartIds } },
    })
    await transaction.emissionFactorPart.deleteMany({ where: { id: { in: emissionFactorPartIds } } })
    await Promise.all(
      parts.map(({ name, ...part }) =>
        prismaClient.emissionFactorPart.create({
          data: {
            emissionFactorId: id,
            ...part,
            metaData: {
              create: { language: local, title: name },
            },
          },
        }),
      ),
    )
  })
}

export const deleteEmissionFactor = async (id: string) => {
  if (!canEditEmissionFactor(id)) {
    return NOT_AUTHORIZED
  }

  await prismaClient.$transaction(async (transaction) => {
    const emissionFactorParts = await transaction.emissionFactorPart.findMany({ where: { emissionFactorId: id } })
    await transaction.emissionFactorPartMetaData.deleteMany({
      where: { emissionFactorPartId: { in: emissionFactorParts.map((emissionFactorPart) => emissionFactorPart.id) } },
    })

    await Promise.all([
      transaction.studyEmissionSource.deleteMany({ where: { emissionFactorId: id } }),
      transaction.emissionFactorMetaData.deleteMany({ where: { emissionFactorId: id } }),
      transaction.emissionFactorPart.deleteMany({
        where: { id: { in: emissionFactorParts.map((emissionFactorPart) => emissionFactorPart.id) } },
      }),
    ])

    await transaction.emissionFactor.delete({ where: { id } })
  })
}
