'use server'

import { getStudySitesByStudyId as dbGetStudySitesByStudyId } from '@/db/site'
import { withServerResponse } from '@/utils/serverResponse'
import { NOT_AUTHORIZED } from '@abc-transitionbascarbone/common/services/permissions/check'
import { hasReadAccessOnStudy } from '../permissions/study.server'

export const getStudySitesByStudyId = async (studyId: string) =>
  withServerResponse('getStudySitesByStudyId', async () => {
    const hasReadAccess = await hasReadAccessOnStudy(studyId)
    if (!hasReadAccess) {
      throw new Error(NOT_AUTHORIZED)
    }

    return dbGetStudySitesByStudyId(studyId)
  })
