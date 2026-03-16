'use server'

import { getLatestSectenVersion as dbGetLatestSectenVersion, getSectenData as dbGetSectenData } from '@/db/secten'
import { ApiResponse, withServerResponse } from '@/utils/serverResponse'
import type { SectenInfo, SectenVersion } from '@prisma/client'

export const getSectenData = async (versionId?: string): Promise<ApiResponse<SectenInfo[]>> =>
  withServerResponse('getSectenData', async () => {
    return dbGetSectenData(versionId)
  })

export const getLatestSectenVersion = async (): Promise<ApiResponse<SectenVersion | null>> =>
  withServerResponse('getLatestSectenVersion', async () => {
    return dbGetLatestSectenVersion()
  })
