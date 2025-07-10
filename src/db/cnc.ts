import { Prisma } from '@prisma/client'
import { prismaClient } from './client'

export const createCNC = async (data: Prisma.CncCreateInput[]) =>
  prismaClient.cnc.createMany({
    data,
  })

export const getCNCById = async (numeroAuto: string) => await prismaClient.cnc.findUnique({ where: { numeroAuto } })

export const getCNCs = async () => await prismaClient.cnc.findMany()
