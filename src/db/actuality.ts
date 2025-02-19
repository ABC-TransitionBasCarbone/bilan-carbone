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
