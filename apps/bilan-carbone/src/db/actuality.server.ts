import { getLocale } from '@/i18n/locale'
import type { Prisma } from '@repo/db-common'
import { prismaClient } from './client.server'

export const getAllActualitiesLocale = async () => {
  const locale = await getLocale()
  return prismaClient.actuality.findMany({ where: { language: locale }, orderBy: { createdAt: 'desc' } })
}

export const getMainActualitiesLocale = async () => {
  const locale = await getLocale()
  return prismaClient.actuality.findMany({ where: { language: locale }, orderBy: { createdAt: 'desc' }, take: 3 })
}

export const createActualities = async (data: Prisma.ActualityCreateInput[]) =>
  prismaClient.actuality.createMany({ data })

export const deleteActuality = async (id: string) => prismaClient.actuality.delete({ where: { id } })
