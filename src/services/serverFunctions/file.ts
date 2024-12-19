'use server'

import { Document } from '@prisma/client'
import { canAccessFlowFromStudy } from '../permissions/study'
import { getFileUrlFromBucket } from '../serverFunctions/scaleway'

export const getDocumentUrl = async (document: Document, studyId: string) => {
  if (!(await canAccessFlowFromStudy(document.id, studyId))) {
    return ''
  }
  return getFileUrlFromBucket(document.bucketKey)
}
