import {
  deleteManagedMessageBanner,
  getActiveMessageBanners,
  getManagedMessageBanners,
  saveManagedMessageBanner,
} from '@abc-transitionbascarbone/common/db/db'
import type { Environment } from '@abc-transitionbascarbone/common/db/enums'
import type { MessageBannerCommand } from '@abc-transitionbascarbone/common/utils/messageBanner.command'
import { mipMessageBannerEnvironments } from '@abc-transitionbascarbone/common/utils/messageBanner.command'
import { prismaClient } from './client'

export const dbGetMessageBannersForManagement = () =>
  getManagedMessageBanners(prismaClient, mipMessageBannerEnvironments)

export const dbGetMessageBannersForEnvironment = (environment: Environment) =>
  getActiveMessageBanners(prismaClient, environment)

export const dbSaveMessageBanner = (data: MessageBannerCommand) =>
  saveManagedMessageBanner(prismaClient, mipMessageBannerEnvironments, data)

export const dbDeleteMessageBanner = (id: string) =>
  deleteManagedMessageBanner(prismaClient, mipMessageBannerEnvironments, id)
