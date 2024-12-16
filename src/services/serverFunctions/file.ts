'use server'

import { Document } from '@prisma/client'
import { getFileUrlFromBucket } from '../file'
import { NOT_AUTHORIZED } from '../permissions/check'
import { canAccessFlowFromStudy } from '../permissions/study'

export const getDocumentUrl = async (document: Document, studyId: string) => {
  if (!(await canAccessFlowFromStudy(document.id, studyId))) {
    return NOT_AUTHORIZED
  }
  return getFileUrlFromBucket(document.bucketKey)
}
