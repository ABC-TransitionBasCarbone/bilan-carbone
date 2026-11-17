'use server'

import {
  deleteMessageBanner as dbDeleteMessageBanner,
  saveMessageBanner as dbSaveMessageBanner,
  getMessageBannersForAdmin,
  getMessageBannersForEnvironment,
} from '@/db/messageBanner'
import { withServerResponse } from '@/utils/serverResponse'
import { Role } from '@abc-transitionbascarbone/common/db/enums'
import { NOT_AUTHORIZED } from '@abc-transitionbascarbone/common/services/permissions/check'
import type { MessageBannerCommand } from '@abc-transitionbascarbone/common/utils/messageBanner.command'
import { dbActualizedAuth } from '../auth'
import { MessageBannerCommandValidation } from './messageBanner.command'

const requireSuperAdmin = async (functionName: string) => {
  const session = await dbActualizedAuth()
  if (!session?.user || session.user.role !== Role.SUPER_ADMIN) {
    console.error(`${functionName}: NOT_AUTHORIZED`, {
      userId: session?.user?.id ?? 'anonymous',
      accountId: session?.user?.accountId,
    })
    throw new Error(NOT_AUTHORIZED)
  }
}

export const getCurrentMessageBanners = async () =>
  withServerResponse('getCurrentMessageBanners', async () => {
    const session = await dbActualizedAuth()
    if (!session?.user) {
      console.error('getCurrentMessageBanners: NOT_AUTHORIZED', { userId: 'anonymous' })
      throw new Error(NOT_AUTHORIZED)
    }

    return getMessageBannersForEnvironment(session.user.environment)
  })

export const getMessageBannersForManagement = async () =>
  withServerResponse('getMessageBannersForManagement', async () => {
    await requireSuperAdmin('getMessageBannersForManagement')
    return getMessageBannersForAdmin()
  })

export const saveMessageBannerForManagement = async (input: MessageBannerCommand) =>
  withServerResponse('saveMessageBannerForManagement', async () => {
    await requireSuperAdmin('saveMessageBannerForManagement')
    const command = MessageBannerCommandValidation.parse(input)
    return dbSaveMessageBanner(command)
  })

export const deleteMessageBannerForManagement = async (id: string) =>
  withServerResponse('deleteMessageBannerForManagement', async () => {
    await requireSuperAdmin('deleteMessageBannerForManagement')
    return dbDeleteMessageBanner(id)
  })
