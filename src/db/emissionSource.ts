import { Prisma } from '@prisma/client'
import { prismaClient } from './client'

export const getEmissionSourceById = (id: string) => prismaClient.studyEmissionSource.findUnique({ where: { id } })

export const createEmissionSourceOnStudy = (emissionSource: Prisma.StudyEmissionSourceCreateInput) =>
  prismaClient.studyEmissionSource.create({
    data: emissionSource,
  })

export const updateEmissionSourceOnStudy = (
  id: string,
  emissionSource: Omit<Prisma.StudyEmissionSourceUpdateInput, 'id' | 'updatedAt'>,
) =>
  prismaClient.studyEmissionSource.update({
    data: { ...emissionSource, updatedAt: new Date() },
    where: { id },
  })
