'use server'

import { getUserByEmail } from '@/db/user'
import { auth } from '../auth'
import { CreateEmissionCommand } from './emission.command'
import { prismaClient } from '@/db/client'
import { EmissionStatus, EmissionType, Import } from '@prisma/client'
import { getLocale } from '@/i18n/request'

export const createEmissionCommand = async ({ name, unit, ...command }: CreateEmissionCommand) => {
  const session = await auth()
  const local = await getLocale()
  if (!session || !session.user || !session.user.email) {
    //TODO: Check du role
    return 'Not authorized'
  }

  const user = await getUserByEmail(session.user.email)

  if (!user) {
    return 'Not authorized'
  }

  await prismaClient.emission.create({
    data: {
      ...command,
      importedFrom: Import.Manual,
      type: EmissionType.Element,
      status: EmissionStatus.Valid,
      organization: { connect: { id: user.organizationId } },
      metaData: {
        create: {
          language: local,
          title: name,
          unit,
        },
      },
    },
  })
}
