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
import { Environment, RoleMip } from '@abc-transitionbascarbone/common/db/enums'
import { NOT_AUTHORIZED } from '@abc-transitionbascarbone/common/services/permissions/check'
import type { MessageBannerCommand } from '@abc-transitionbascarbone/common/utils/messageBanner.command'
import {
  makeMessageBannerCommandValidation,
  messageBannerEnvironments,
} from '@abc-transitionbascarbone/common/utils/messageBanner.command'

const MIPMessageBannerCommandValidation = makeMessageBannerCommandValidation(messageBannerEnvironments)

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
    return getManagedMessageBanners(prismaClient, messageBannerEnvironments)
  })

export const saveMessageBannerForManagement = async (input: MessageBannerCommand) =>
  withServerResponse('saveMessageBannerForManagement', async () => {
    await requireSuperAdmin('saveMessageBannerForManagement')
    return saveManagedMessageBanner(
      prismaClient,
      messageBannerEnvironments,
      MIPMessageBannerCommandValidation.parse(input),
    )
  })

export const deleteMessageBannerForManagement = async (id: string) =>
  withServerResponse('deleteMessageBannerForManagement', async () => {
    await requireSuperAdmin('deleteMessageBannerForManagement')
    return deleteManagedMessageBanner(prismaClient, messageBannerEnvironments, id)
  })

export const getCurrentMessageBanners = async () =>
  withServerResponse('getCurrentMessageBanners', async () => {
    const session = await dbActualizedAuth()
    if (!session?.user) {
      console.error('getCurrentMessageBanners: NOT_AUTHORIZED', { userId: 'anonymous' })
      throw new Error(NOT_AUTHORIZED)
    }

    return getActiveMessageBanners(prismaClient, Environment.MIP)
  })
