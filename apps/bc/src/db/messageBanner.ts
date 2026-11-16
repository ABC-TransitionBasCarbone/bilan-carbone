import type { MessageBanner, Prisma } from '@abc-transitionbascarbone/common/db'
import { getActiveMessageBannerWhere } from '@abc-transitionbascarbone/common/db/db'
import { Environment } from '@abc-transitionbascarbone/common/db/enums'
import { prismaClient } from './client'

export const getMessageBannersForAdmin = () => prismaClient.messageBanner.findMany({ orderBy: { startAt: 'desc' } })

export const getMessageBannersForEnvironment = (environment: Environment) =>
  prismaClient.messageBanner.findMany({
    where: getActiveMessageBannerWhere(environment),
    orderBy: { startAt: 'asc' },
  })

export const saveMessageBanner = ({ id, ...data }: Prisma.MessageBannerUncheckedCreateInput) =>
  id ? prismaClient.messageBanner.update({ where: { id }, data }) : prismaClient.messageBanner.create({ data })

export const deleteMessageBanner = (id: MessageBanner['id']) => prismaClient.messageBanner.delete({ where: { id } })
