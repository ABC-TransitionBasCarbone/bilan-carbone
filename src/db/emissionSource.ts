import { Prisma } from '@prisma/client'
import { prismaClient } from './client'

export const createEmissionSourceOnStudy = (emissionSource: Prisma.StudyEmissionSourceCreateInput) =>
  prismaClient.studyEmissionSource.create({
    data: emissionSource,
  })

export const updateEmissionSourceOnStudy = (id: string, emissionSource: Prisma.StudyEmissionSourceUpdateInput) =>
  prismaClient.studyEmissionSource.update({
    data: { ...emissionSource, updatedAt: new Date() },
    where: { id },
  })
