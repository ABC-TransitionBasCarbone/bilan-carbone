'use server'

import { withServerResponse } from '@/utils/serverResponse'
import { canAccessStudyFlows } from '../permissions/study'
import { getFileUrlFromBucket } from './scaleway'

export const getStudyFlowSampleDocumentUrl = async (studyId: string) =>
  withServerResponse('getStudyFlowSampleDocumentUrl', async () => {
    if (!(await canAccessStudyFlows(studyId))) {
      return ''
    }
    console.log('proaacess', process.env.STUDY_FLOW_EXAMPLE_KEY)
    const res = await getFileUrlFromBucket(process.env.STUDY_FLOW_EXAMPLE_KEY || '')
    return res.success ? res.data : ''
  })
