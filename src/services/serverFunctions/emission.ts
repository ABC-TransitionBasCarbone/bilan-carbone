'use server'

import { getUserByEmail } from '@/db/user'
import { auth } from '../auth'
import { CreateEmissionCommand } from './emission.command'
import { EmissionStatus, Import, Unit } from '@prisma/client'
import { getLocale } from '@/i18n/request'
import { prismaClient } from '@/db/client'
import { createEmission } from '@/db/emissions'
import { NOT_AUTHORIZED } from '../permissions/check'
import { canCreateEmission } from '../permissions/emission'

export const createEmissionCommand = async ({
  name,
  unit,
  attribute,
  comment,
  parts,
  subPost,
  ...command
}: CreateEmissionCommand) => {
  const session = await auth()
  const local = await getLocale()
  if (!session || !session.user) {
    return NOT_AUTHORIZED
  }

  const user = await getUserByEmail(session.user.email)

  if (!user) {
    return NOT_AUTHORIZED
  }

  if (!canCreateEmission()) {
    return NOT_AUTHORIZED
  }

  const emission = await createEmission({
    ...command,
    importedFrom: Import.Manual,
    status: EmissionStatus.Valid,
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
      prismaClient.emissionPart.create({
        data: {
          emissionId: emission.id,
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
