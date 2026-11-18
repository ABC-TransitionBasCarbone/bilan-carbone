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

export const dbGetMessageBannersForManagement = () => getManagedMessageBanners(prismaClient, bcEnvironments)

export const dbGetMessageBannersForEnvironment = (environment: Environment) =>
  prismaClient.messageBanner.findMany({
    where: getActiveMessageBannerWhere(environment),
    orderBy: { startDate: 'asc' },
  })

export const dbSaveMessageBanner = (data: Prisma.MessageBannerUncheckedCreateInput) =>
  saveManagedMessageBanner(prismaClient, bcEnvironments, data)

export const dbDeleteMessageBanner = (id: MessageBanner['id']) =>
  deleteManagedMessageBanner(prismaClient, bcEnvironments, id)
