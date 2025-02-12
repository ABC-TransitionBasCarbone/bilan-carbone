import { Prisma } from '@prisma/client'
import { prismaClient } from './client'

export const getEmissionSourceById = async (id: string) =>
  prismaClient.studyEmissionSource.findUnique({ where: { id } })

export const createEmissionSourceOnStudy = async (emissionSource: Prisma.StudyEmissionSourceCreateInput) =>
  prismaClient.studyEmissionSource.create({
    data: emissionSource,
  })

export const updateEmissionSourceOnStudy = async (
  id: string,
  emissionSource: Omit<Prisma.StudyEmissionSourceUpdateInput, 'id' | 'updatedAt'>,
) =>
  prismaClient.studyEmissionSource.update({
    data: { ...emissionSource, updatedAt: new Date() },
    where: { id },
  })

export const deleteEmissionSourceOnStudy = async (id: string) =>
  prismaClient.studyEmissionSource.delete({ where: { id } })
