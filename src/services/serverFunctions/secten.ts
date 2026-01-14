'use server'

import { getSectenData as dbGetSectenData } from '@/db/secten'
import { ApiResponse, withServerResponse } from '@/utils/serverResponse'
import type { SectenInfo } from '@prisma/client'

export const getSectenData = async (): Promise<ApiResponse<SectenInfo[]>> =>
  withServerResponse('getSectenData', async () => {
    return dbGetSectenData()
  })
