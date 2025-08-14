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

export const createEmissionSourceTagOnStudy = (emissionSourceTag: Prisma.EmissionSourceTagCreateInput) =>
  prismaClient.emissionSourceTag.create({
    data: emissionSourceTag,
  })

export const deleteEmissionSourceTagOnStudy = (id: string) => prismaClient.emissionSourceTag.delete({ where: { id } })

export const getEmissionSourceTagFamilyById = async (familyId: string) =>
  prismaClient.emissionSourceTagFamily.findUnique({ where: { id: familyId } })

export const upsertEmissionSourceTagFamilyById = async (studyId: string, name: string, familyId?: string) =>
  familyId
    ? prismaClient.emissionSourceTagFamily.update({
        where: { id: familyId },
        data: { name },
      })
    : prismaClient.emissionSourceTagFamily.create({
        data: { name, studyId },
      })

export const removeSourceTagFamilyById = async (familyId: string) => {
  await prismaClient.emissionSourceTag.deleteMany({ where: { familyId } })
  return prismaClient.emissionSourceTagFamily.delete({ where: { id: familyId } })
}
