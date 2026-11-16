'use server'

import { prismaClient } from '@/db/client'
import { dbActualizedAuth } from '@/services/auth'
import { withServerResponse } from '@/utils/serverResponse'
import { getActiveMessageBannerWhere } from '@abc-transitionbascarbone/common/db/db'
import { Environment } from '@abc-transitionbascarbone/common/db/enums'
import { NOT_AUTHORIZED } from '@abc-transitionbascarbone/common/services/permissions/check'

export const getCurrentMessageBanners = async () =>
  withServerResponse('getCurrentMessageBanners', async () => {
    const session = await dbActualizedAuth()
    if (!session?.user) {
      console.error('getCurrentMessageBanners: NOT_AUTHORIZED', { userId: 'anonymous' })
      throw new Error(NOT_AUTHORIZED)
    }

    return prismaClient.messageBanner.findMany({
      where: getActiveMessageBannerWhere(Environment.MIP),
      orderBy: { startAt: 'asc' },
    })
  })
