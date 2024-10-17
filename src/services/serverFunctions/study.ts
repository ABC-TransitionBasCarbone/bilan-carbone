'use server'

import { CreateStudyCommand } from './study.command'
import { auth } from '../auth'
import { createStudy } from '@/db/study'
import { ControlMode, Export } from '@prisma/client'
import dayjs from 'dayjs'

export const createStudyCommand = async ({ organizationId, ...command }: CreateStudyCommand) => {
  const session = await auth()
  if (!session || !session.user) {
    //TODO: Check du role
    return 'Not authorized'
  }

  try {
    await createStudy({
      ...command,
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
    })

    return false
  } catch (e) {
    console.error(e)
    return 'Something went wrong...'
  }
}
