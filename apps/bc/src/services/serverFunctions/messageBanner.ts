'use server'

import { prismaClient } from '@/db/client'
import { dbActualizedAuth } from '@/services/auth'
import { withServerResponse } from '@/utils/serverResponse'
import {
  deleteManagedMessageBanner,
  getActiveMessageBanners,
  getManagedMessageBanners,
  saveManagedMessageBanner,
} from '@abc-transitionbascarbone/common/db/db'
import { NOT_AUTHORIZED } from '@abc-transitionbascarbone/common/services/permissions/check'
import type { MessageBannerCommand } from '@abc-transitionbascarbone/common/utils/messageBanner.command'
import {
  makeMessageBannerCommandValidation,
  messageBannerEnvironments,
} from '@abc-transitionbascarbone/common/utils/messageBanner.command'
import { requireSuperAdmin } from '../permissions/superAdmin'

const BCMessageBannerCommandValidation = makeMessageBannerCommandValidation(messageBannerEnvironments)

export const getCurrentMessageBanners = async () =>
  withServerResponse('getCurrentMessageBanners', async () => {
    const session = await dbActualizedAuth()
    if (!session?.user) {
      console.error('getCurrentMessageBanners: NOT_AUTHORIZED', { userId: 'anonymous' })
      throw new Error(NOT_AUTHORIZED)
    }

    return getActiveMessageBanners(prismaClient, session.user.environment)
  })

export const getMessageBannersForManagement = async () =>
  withServerResponse('getMessageBannersForManagement', async () => {
    await requireSuperAdmin('getMessageBannersForManagement')
    return getManagedMessageBanners(prismaClient, messageBannerEnvironments)
  })

export const saveMessageBannerForManagement = async (input: MessageBannerCommand) =>
  withServerResponse('saveMessageBannerForManagement', async () => {
    await requireSuperAdmin('saveMessageBannerForManagement')
    const command = BCMessageBannerCommandValidation.parse(input)
    return saveManagedMessageBanner(prismaClient, messageBannerEnvironments, command)
  })

export const deleteMessageBannerForManagement = async (id: string) =>
  withServerResponse('deleteMessageBannerForManagement', async () => {
    await requireSuperAdmin('deleteMessageBannerForManagement')
    return deleteManagedMessageBanner(prismaClient, messageBannerEnvironments, id)
  })
