'use server'

import { prismaClient } from '@/db/client'
import { dbDeleteMessageBanner, dbGetMessageBannersForManagement, dbSaveMessageBanner } from '@/db/messageBanner'
import { dbActualizedAuth } from '@/services/auth'
import { withServerResponse } from '@/utils/serverResponse'
import { getActiveMessageBannerWhere } from '@abc-transitionbascarbone/common/db/db'
import { Environment, RoleMip } from '@abc-transitionbascarbone/common/db/enums'
import { NOT_AUTHORIZED } from '@abc-transitionbascarbone/common/services/permissions/check'
import type { MessageBannerCommand } from '@abc-transitionbascarbone/common/utils/messageBanner.command'
import { MIPMessageBannerCommandValidation } from './messageBanner.command'

const requireSuperAdmin = async (functionName: string) => {
  const session = await dbActualizedAuth()
  if (!session?.user || session.user.role !== RoleMip.SUPER_ADMIN) {
    console.error(`${functionName}: NOT_AUTHORIZED`, { userId: session?.user?.id ?? 'anonymous' })
    throw new Error(NOT_AUTHORIZED)
  }
}

export const getMessageBannersForManagement = async () =>
  withServerResponse('getMessageBannersForManagement', async () => {
    await requireSuperAdmin('getMessageBannersForManagement')
    return dbGetMessageBannersForManagement()
  })

export const saveMessageBannerForManagement = async (input: MessageBannerCommand) =>
  withServerResponse('saveMessageBannerForManagement', async () => {
    await requireSuperAdmin('saveMessageBannerForManagement')
    return dbSaveMessageBanner(MIPMessageBannerCommandValidation.parse(input))
  })

export const deleteMessageBannerForManagement = async (id: string) =>
  withServerResponse('deleteMessageBannerForManagement', async () => {
    await requireSuperAdmin('deleteMessageBannerForManagement')
    return dbDeleteMessageBanner(id)
  })

export const getCurrentMessageBanners = async () =>
  withServerResponse('getCurrentMessageBanners', async () => {
    const session = await dbActualizedAuth()
    if (!session?.user) {
      console.error('getCurrentMessageBanners: NOT_AUTHORIZED', { userId: 'anonymous' })
      throw new Error(NOT_AUTHORIZED)
    }

    return prismaClient.messageBanner.findMany({
      where: getActiveMessageBannerWhere(Environment.MIP),
      orderBy: { startDate: 'asc' },
    })
  })
