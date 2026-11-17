import type { MessageBanner, Prisma } from '@abc-transitionbascarbone/common/db'
import {
  deleteManagedMessageBanner,
  getActiveMessageBannerWhere,
  getManagedMessageBanners,
  saveManagedMessageBanner,
} from '@abc-transitionbascarbone/common/db/db'
import { Environment } from '@abc-transitionbascarbone/common/db/enums'
import { bcEnvironments } from '@abc-transitionbascarbone/common/utils/environments'
import { prismaClient } from './client'

export const getMessageBannersForAdmin = () => getManagedMessageBanners(prismaClient, bcEnvironments)

export const getMessageBannersForEnvironment = (environment: Environment) =>
  prismaClient.messageBanner.findMany({
    where: getActiveMessageBannerWhere(environment),
    orderBy: { startAt: 'asc' },
  })

export const saveMessageBanner = (data: Prisma.MessageBannerUncheckedCreateInput) =>
  saveManagedMessageBanner(prismaClient, bcEnvironments, data)

export const deleteMessageBanner = (id: MessageBanner['id']) =>
  deleteManagedMessageBanner(prismaClient, bcEnvironments, id)
