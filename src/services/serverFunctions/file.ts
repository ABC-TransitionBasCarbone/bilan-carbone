'use server'

import { getFileUrlFromBucket } from '../file'

export const getDocument = async (fileKey: string) => getFileUrlFromBucket(fileKey)
