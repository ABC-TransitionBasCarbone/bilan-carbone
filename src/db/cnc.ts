import { Prisma } from '@prisma/client'
import { prismaClient } from './client'

export const createCNC = async (data: Prisma.CncCreateInput[]) =>
  prismaClient.cnc.createMany({
    data,
  })

export const getCNCById = async (numeroAuto: string) => await prismaClient.cnc.findUnique({ where: { numeroAuto } })
export const getNumberOfProgrammedFilms = async (id: string | null) =>
  id
    ? (await prismaClient.cnc.findUnique({ select: { numberOfProgrammedFilms: true }, where: { id } }))
        ?.numberOfProgrammedFilms || 0
    : 0
