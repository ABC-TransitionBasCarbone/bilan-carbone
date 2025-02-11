'use server'

import { prismaClient } from './client'

export const getAllActualities = async () =>
  prismaClient.actuality.findMany({
    orderBy: { createdAt: 'desc' },
  })
