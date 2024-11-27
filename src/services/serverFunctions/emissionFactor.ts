'use server'

import { prismaClient } from '@/db/client'
import { createEmissionFactor } from '@/db/emissionFactors'
import { getUserByEmail } from '@/db/user'
import { getLocale } from '@/i18n/locale'
import { EmissionFactorStatus, Import, Unit } from '@prisma/client'
import { auth } from '../auth'
import { getEmissionFactors, getEmissionFactorsByIds } from '../emissionFactors'
import { NOT_AUTHORIZED } from '../permissions/check'
import { canCreateEmissionFactor } from '../permissions/emissionFactor'
import { CreateEmissionFactorCommand } from './emissionFactor.command'

export const getEmissionsFactor = async () => {
  const locale = await getLocale()
  return getEmissionFactors(locale)
}

export const getEmissionFactorByIds = async (ids: string[]) => {
  const locale = await getLocale()
  return getEmissionFactorsByIds(ids, locale)
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
