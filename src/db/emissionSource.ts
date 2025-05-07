import { Prisma } from '@prisma/client'
import { prismaClient } from './client'

export const getEmissionSourceById = (id: string) => prismaClient.studyEmissionSource.findUnique({ where: { id } })

export const createEmissionSourceOnStudy = (emissionSource: Prisma.StudyEmissionSourceCreateInput) =>
  prismaClient.studyEmissionSource.create({
    data: emissionSource,
  })

export const updateEmissionSourceOnStudy = (
  id: string,
  emissionSource: Omit<Prisma.StudyEmissionSourceUpdateInput, 'id'>,
) =>
  prismaClient.studyEmissionSource.update({
    data: { ...emissionSource },
    where: { id },
  })

export const deleteEmissionSourceOnStudy = (id: string) => prismaClient.studyEmissionSource.delete({ where: { id } })
