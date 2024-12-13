'use server'

import { getFileUrlFromBucket, uploadFileToBucket } from '../file'

export const uploadDocument = async (file: File, studyId: string) => uploadFileToBucket(file, studyId)

export const getDocument = async (fileKey: string) => getFileUrlFromBucket(fileKey)
