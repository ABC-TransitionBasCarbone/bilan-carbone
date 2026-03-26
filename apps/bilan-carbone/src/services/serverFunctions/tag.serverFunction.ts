'use server'

import { getStudyTagsByStudyId as dbGetStudyTagsByStudyId } from '@/db/tag.db'
import { withServerResponse } from '@/utils/serverResponse'
import { NOT_AUTHORIZED } from '../permissions/check'
import { hasReadAccessOnStudy } from '../permissions/study'

export const getStudyTagsByStudyId = async (studyId: string) =>
  withServerResponse('getStudyTagsByStudyId', async () => {
    const hasReadAccess = await hasReadAccessOnStudy(studyId)
    if (!hasReadAccess) {
      throw new Error(NOT_AUTHORIZED)
    }

    return dbGetStudyTagsByStudyId(studyId)
  })
