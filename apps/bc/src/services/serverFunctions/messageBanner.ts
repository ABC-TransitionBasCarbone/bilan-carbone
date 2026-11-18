'use server'

import {
  dbDeleteMessageBanner,
  dbGetMessageBannersForEnvironment,
  dbGetMessageBannersForManagement,
  dbSaveMessageBanner,
} from '@/db/messageBanner'
import { dbActualizedAuth } from '@/services/auth'
import { withServerResponse } from '@/utils/serverResponse'
import { NOT_AUTHORIZED } from '@abc-transitionbascarbone/common/services/permissions/check'
import type { MessageBannerCommand } from '@abc-transitionbascarbone/common/utils/messageBanner.command'
import { requireSuperAdmin } from '../permissions/superAdmin'
import { BCMessageBannerCommandValidation } from './messageBanner.command'

export const getCurrentMessageBanners = async () =>
  withServerResponse('getCurrentMessageBanners', async () => {
    const session = await dbActualizedAuth()
    if (!session?.user) {
      console.error('getCurrentMessageBanners: NOT_AUTHORIZED', { userId: 'anonymous' })
      throw new Error(NOT_AUTHORIZED)
    }

    return dbGetMessageBannersForEnvironment(session.user.environment)
  })

export const getMessageBannersForManagement = async () =>
  withServerResponse('getMessageBannersForManagement', async () => {
    await requireSuperAdmin('getMessageBannersForManagement')
    return dbGetMessageBannersForManagement()
  })

export const saveMessageBannerForManagement = async (input: MessageBannerCommand) =>
  withServerResponse('saveMessageBannerForManagement', async () => {
    await requireSuperAdmin('saveMessageBannerForManagement')
    const command = BCMessageBannerCommandValidation.parse(input)
    return dbSaveMessageBanner(command)
  })

export const deleteMessageBannerForManagement = async (id: string) =>
  withServerResponse('deleteMessageBannerForManagement', async () => {
    await requireSuperAdmin('deleteMessageBannerForManagement')
    return dbDeleteMessageBanner(id)
  })
