'use server'

import { getSituationByStudySite } from '@/db/situation'
import { withServerResponse } from '@/utils/serverResponse'
import { dbActualizedAuth } from '../auth'
import { NOT_AUTHORIZED } from '../permissions/check'

export const getSituationFromDB = async (studySiteId: string) =>
  withServerResponse('getSituationFromDB', async () => {
    const session = await dbActualizedAuth()
    if (!session || !session.user) {
      throw new Error(NOT_AUTHORIZED)
    }

    return await getSituationByStudySite(studySiteId)
  })
