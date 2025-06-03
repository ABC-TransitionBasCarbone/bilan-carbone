import { Prisma } from '@prisma/client'
import { prismaClient } from './client'

export const createCNC = async (data: Prisma.CNCCreateInput[]) =>
    prismaClient.cNC.createMany({ data })
