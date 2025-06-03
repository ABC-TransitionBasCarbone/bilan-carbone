import { Prisma } from '@prisma/client'
import { prismaClient } from './client'

export const createCNC = async (data: Prisma.CncCreateInput[]) =>
  prismaClient.cnc.createMany({
    data,
  })
