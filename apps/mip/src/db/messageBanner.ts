import {
  deleteManagedMessageBanner,
  getManagedMessageBanners,
  saveManagedMessageBanner,
} from '@abc-transitionbascarbone/common/db/db'
import type { MessageBannerCommand } from '@abc-transitionbascarbone/common/utils/messageBanner.command'
import { mipMessageBannerEnvironments } from '@abc-transitionbascarbone/common/utils/messageBanner.command'
import { prismaClient } from './client'

export const getMessageBannersForAdmin = () => getManagedMessageBanners(prismaClient, mipMessageBannerEnvironments)

export const saveMessageBanner = (data: MessageBannerCommand) =>
  saveManagedMessageBanner(prismaClient, mipMessageBannerEnvironments, data)

export const deleteMessageBanner = (id: string) =>
  deleteManagedMessageBanner(prismaClient, mipMessageBannerEnvironments, id)
