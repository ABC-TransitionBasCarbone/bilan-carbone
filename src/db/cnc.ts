import { Prisma } from '@prisma/client'
import { prismaClient } from './client'

export const upsertCNC = async (data: Prisma.CncCreateInput[]) => {
  await Promise.all(
    data.map(async (entry) => {
      if (!entry.numeroAuto) {
        console.warn('CNC ignoré car numeroAuto est manquant :', entry)
        return
      }

      await prismaClient.cnc.upsert({
        where: { numeroAuto: entry.numeroAuto },
        create: entry,
        update: {
          ...entry,
        },
      })
    }),
  )
}

export const findCncByNumeroAuto = async (numeroAuto: string) =>
  await prismaClient.cnc.findUnique({ where: { numeroAuto } })

export const findCncById = async (id: string) => await prismaClient.cnc.findUnique({ where: { id } })
export const getCNCs = async () => await prismaClient.cnc.findMany(
  {
    where: {
      numeroAuto: {
        not: null,
      },
    },
    orderBy: {
      codeInsee: 'asc',
    },
  },
)
