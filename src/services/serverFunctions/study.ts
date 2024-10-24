'use server'

import { CreateStudyCommand } from './study.command'
import { auth } from '../auth'
import { createStudy } from '@/db/study'
import { ControlMode, Export } from '@prisma/client'
import dayjs from 'dayjs'
import { NOT_AUTHORIZED } from '../permissions/check'
import { canCreateStudy } from '../permissions/study'

export const createStudyCommand = async ({ organizationId, ...command }: CreateStudyCommand) => {
  const session = await auth()
  if (!session || !session.user) {
    return NOT_AUTHORIZED
  }
  const study = {
    ...command,
    createdBy: { connect: { id: session.user.id } },
    startDate: dayjs(command.startDate).toDate(),
    endDate: dayjs(command.endDate).toDate(),
    organization: { connect: { id: organizationId } },
    exports: {
      createMany: {
        data: Object.entries(command.exports)
          .filter(([, value]) => value)
          .map(([key, value]) => ({
            type: key as Export,
            control: value as ControlMode,
          })),
      },
    },
  }

  if (!(await canCreateStudy(session.user, study, organizationId))) {
    return NOT_AUTHORIZED
  }

  try {
    await createStudy(study)

    return false
  } catch (e) {
    console.error(e)
    return 'Something went wrong...'
  }
}
