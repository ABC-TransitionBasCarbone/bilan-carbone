import { Environment } from '../enums'
import type { Prisma, PrismaClient } from '../generated/prisma/client'

export const getMessageBannerManagementWhere = (environments: Environment[]): Prisma.MessageBannerWhereInput => ({
  environments: { hasSome: environments },
  NOT: {
    environments: { hasSome: Object.values(Environment).filter((environment) => !environments.includes(environment)) },
  },
})

export const getManagedMessageBanners = (client: PrismaClient, environments: Environment[]) =>
  client.messageBanner.findMany({
    where: getMessageBannerManagementWhere(environments),
    orderBy: { startAt: 'desc' },
  })

export const saveManagedMessageBanner = (
  client: PrismaClient,
  environments: Environment[],
  { id, ...data }: Prisma.MessageBannerUncheckedCreateInput,
) =>
  id
    ? client.messageBanner.update({ where: { ...getMessageBannerManagementWhere(environments), id }, data })
    : client.messageBanner.create({ data })

export const deleteManagedMessageBanner = (client: PrismaClient, environments: Environment[], id: string) =>
  client.messageBanner.delete({ where: { ...getMessageBannerManagementWhere(environments), id } })

export const getActiveMessageBannerWhere = (
  environment: Environment,
  now: Date = new Date(),
): Prisma.MessageBannerWhereInput => ({
  active: true,
  environments: { has: environment },
  startAt: { lte: now },
  endAt: { gte: now },
})
