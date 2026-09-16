'use server'

import { withServerResponse } from '@/utils/serverResponse'
import { Document } from '@abc-transitionbascarbone/db-common'
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
  const formattedData = data.map((d) => ({
    ...d,
    name: d.name.slice(0, 31),
  }))
  const buffer = xlsx.build(formattedData)

  const arrayBuffer = new ArrayBuffer(buffer.length)
  const view = new Uint8Array(arrayBuffer)
  for (let i = 0; i < buffer.length; ++i) {
    view[i] = buffer[i]
  }
  return arrayBuffer
}
