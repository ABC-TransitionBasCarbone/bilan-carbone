'use server'

import { getUserByEmail } from '@/db/user'
import { auth } from '../auth'
import { CreateEmissionCommand } from './emission.command'
import { EmissionStatus, EmissionType, Import } from '@prisma/client'
import { getLocale } from '@/i18n/request'
import { createEmission } from '@/db/emissions'
import { NOT_AUTHORIZED } from '../permissions/check'
import { canCreateEmission } from '../permissions/emission'

export const createEmissionCommand = async ({ name, unit, attribute, comment, ...command }: CreateEmissionCommand) => {
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

  await createEmission({
    ...command,
    importedFrom: Import.Manual,
    type: EmissionType.Element,
    status: EmissionStatus.Valid,
    reliability: 5,
    organization: { connect: { id: user.organizationId } },
    metaData: {
      create: {
        language: local,
        title: name,
        attribute,
        unit,
        comment,
      },
    },
  })
}
