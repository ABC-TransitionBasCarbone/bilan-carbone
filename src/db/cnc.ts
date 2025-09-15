import { Prisma } from '@prisma/client'
import { prismaClient } from './client'

export const getOrCreateCncVersion = async (year: number) => {
  const existingVersion = await prismaClient.cncVersion.findUnique({
    where: { year },
  })

  if (existingVersion) {
    return existingVersion
  }

  return await prismaClient.cncVersion.create({
    data: { year },
  })
}

export const getLatestCncVersion = async () => {
  return await prismaClient.cncVersion.findFirst({
    orderBy: { year: 'desc' },
  })
}

export const upsertCNC = async (data: (Prisma.CncCreateManyInput & { cncVersionId: string })[]) => {
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

export const findCncByNumeroAuto = async (numeroAuto: string) => {
  return prismaClient.cnc.findUnique({
    where: { numeroAuto },
    include: { cncVersion: true },
  })
}

export const findCncById = async (id: string) => await prismaClient.cnc.findUnique({ where: { id } })

export const updateNumberOfProgrammedFilms = async ({
  cncId,
  numberOfProgrammedFilms,
}: {
  cncId: string
  numberOfProgrammedFilms: number | null | undefined
}) => {
  await prismaClient.cnc.update({
    data: {
      numberOfProgrammedFilms: numberOfProgrammedFilms ?? 0,
    },
    where: {
      id: cncId,
    },
  })
}

export const getCNCs = async () =>
  await prismaClient.cnc.findMany({
    where: {
      numeroAuto: {
        not: null,
      },
    },
    orderBy: {
      codeInsee: 'asc',
    },
  })
