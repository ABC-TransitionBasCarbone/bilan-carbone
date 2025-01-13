'use server'

import { Document } from '@prisma/client'
import xlsx from 'node-xlsx'
import { canAccessFlowFromStudy } from '../permissions/study'
import { getFileUrlFromBucket } from '../serverFunctions/scaleway'

export const getDocumentUrl = async (document: Document, studyId: string) => {
  if (!(await canAccessFlowFromStudy(document.id, studyId))) {
    return ''
  }
  return getFileUrlFromBucket(document.bucketKey)
}

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
