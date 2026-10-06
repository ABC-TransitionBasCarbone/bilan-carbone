import { getLocale } from '@/i18n/locale'
import type { Prisma } from '@abc-transitionbascarbone/common/db'
import { Environment } from '@abc-transitionbascarbone/common/db/enums'
import { prismaClient } from './client.server'

export const getAllActualitiesLocale = async (environment: Environment) => {
  const locale = await getLocale()
  return prismaClient.actuality.findMany({ where: { language: locale, environment }, orderBy: { createdAt: 'desc' } })
}

export const getMainActualitiesLocale = async (environment: Environment) => {
  const locale = await getLocale()
  return prismaClient.actuality.findMany({
    where: { language: locale, environment },
    orderBy: { createdAt: 'desc' },
    take: 3,
  })
}

export const createActualities = async (data: Prisma.ActualityCreateInput[]) =>
  prismaClient.actuality.createMany({ data })

export const deleteActuality = async (id: string) => prismaClient.actuality.delete({ where: { id } })
