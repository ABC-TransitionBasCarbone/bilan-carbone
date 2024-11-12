import { Prisma } from '@prisma/client'
import { prismaClient } from './client'

export const createEmissionSourceOnStudy = (emissionSource: Prisma.StudyEmissionSourceCreateInput) =>
  prismaClient.studyEmissionSource.create({
    data: emissionSource,
  })
