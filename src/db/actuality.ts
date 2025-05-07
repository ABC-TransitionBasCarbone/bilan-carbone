import { Prisma } from '@prisma/client'
import { prismaClient } from './client'

export const getAllActualities = () =>
  prismaClient.actuality.findMany({
    orderBy: { createdAt: 'desc' },
  })

export const getMainActualities = () =>
  prismaClient.actuality.findMany({
    orderBy: { createdAt: 'desc' },
    take: 3,
  })

export const createActualities = async (data: Prisma.ActualityCreateInput[]) =>
  prismaClient.actuality.createMany({ data })

export const deleteActuality = async (id: string) => prismaClient.actuality.delete({ where: { id } })
