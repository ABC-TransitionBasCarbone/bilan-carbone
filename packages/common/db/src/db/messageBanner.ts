import { Environment } from '../enums'
import type { Prisma, PrismaClient } from '../generated/prisma/client'

export const getMessageBannerManagementWhereCondition = (
  environments: Environment[],
): Prisma.MessageBannerWhereInput => ({ environments: { hasSome: environments } })

export const getManagedMessageBanners = (client: PrismaClient, environments: Environment[]) =>
  client.messageBanner.findMany({
    where: getMessageBannerManagementWhereCondition(environments),
    orderBy: { startDate: 'desc' },
  })

export const saveManagedMessageBanner = (
  client: PrismaClient,
  environments: Environment[],
  { id, ...data }: Prisma.MessageBannerUncheckedCreateInput,
) =>
  id
    ? client.messageBanner.update({ where: { ...getMessageBannerManagementWhereCondition(environments), id }, data })
    : client.messageBanner.create({ data })

export const deleteManagedMessageBanner = (client: PrismaClient, environments: Environment[], id: string) =>
  client.messageBanner.delete({ where: { ...getMessageBannerManagementWhereCondition(environments), id } })

export const getActiveMessageBannerWhere = (
  environment: Environment,
  now: Date = new Date(),
): Prisma.MessageBannerWhereInput => ({
  environments: { has: environment },
  startDate: { lte: now },
  endDate: { gte: now },
})

export const getActiveMessageBanners = (client: PrismaClient, environment: Environment) =>
  client.messageBanner.findMany({
    where: getActiveMessageBannerWhere(environment),
    orderBy: { startDate: 'asc' },
  })
