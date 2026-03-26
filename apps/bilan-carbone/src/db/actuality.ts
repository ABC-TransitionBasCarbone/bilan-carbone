import { getLocale } from '@/i18n/locale'
import { Prisma } from '@prisma/client'
import { prismaClient } from './client'

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
