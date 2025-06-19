'use server'

import { withServerResponse } from '@/utils/serverResponse'
import { Document } from '@prisma/client'
import xlsx from 'node-xlsx'
import { canAccessFlowFromStudy } from '../permissions/study'
import { getFileUrlFromBucket } from '../serverFunctions/scaleway'

export const getDocumentUrl = async (document: Document, studyId: string) =>
  withServerResponse('getDocumentUrl', async () => {
    if (!(await canAccessFlowFromStudy(document.id, studyId))) {
      return ''
    }
    const res = await getFileUrlFromBucket(document.bucketKey)
    return res.success ? res.data : ''
  })

export const prepareExcel = async (
  data: {
    name: string
    data: (string | number)[][]
    options: object
  }[],
) => {
  const buffer = xlsx.build(data)
  return buffer
}
