'use server'

import { withServerResponse } from '@/utils/serverResponse'
import { DocumentCategory } from '@prisma/client'
import { canAccessStudyFlows } from '../permissions/study'
import { getFileUrlFromBucket } from './scaleway'

const getStudyFlowSampleDocumentUrl = async (studyId: string) =>
  withServerResponse('getStudyFlowSampleDocumentUrl', async () => {
    if (!(await canAccessStudyFlows(studyId))) {
      return ''
    }
    const res = await getFileUrlFromBucket(process.env.STUDY_FLOW_EXAMPLE_KEY || '')
    return res.success ? res.data : ''
  })

const getDependencyMatrixSampleDocumentUrl = async () =>
  withServerResponse('getDependencyMatrixSampleDocumentUrl', async () => {
    const res = await getFileUrlFromBucket(process.env.DEPENDENCY_MATRIX_EXAMPLE_KEY || '')
    return res.success ? res.data : ''
  })

export const getDocumentUrl = async (documentKey: string) =>
  withServerResponse('getDocumentUrl', async () => {
    const key = process.env[documentKey]

    if (!key) {
      throw new Error('Document key not found')
    }

    const res = await getFileUrlFromBucket(key)
    return res.success ? res.data : ''
  })

export const getDocumentSample = async (studyId: string, documentCategory?: DocumentCategory) =>
  withServerResponse('getDocumentSample', async () => {
    let res
    switch (documentCategory) {
      case DocumentCategory.DependencyMatrix:
        res = await getDependencyMatrixSampleDocumentUrl()
        break
      default:
        res = await getStudyFlowSampleDocumentUrl(studyId)
        break
    }
    return res.success ? res.data : ''
  })
