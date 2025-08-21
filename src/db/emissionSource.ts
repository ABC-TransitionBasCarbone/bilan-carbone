import { defaultEmissionSourceTags } from '@/constants/emissionSourceTags'
import { Environment, Prisma } from '@prisma/client'
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

export const createEmissionSourceTagFamilyAndRelatedTags = async (
  studyId: string,
  data: { familyName: string; tags: { name: string; color: string }[] }[],
  environment: Environment,
) => {
  const environmentTags = defaultEmissionSourceTags[environment as keyof typeof defaultEmissionSourceTags]

  const familyTagsToCreate = data.filter((d) => d.familyName !== 'défaut')
  const tagsToCreate = data.map((family) => {
    if (family.familyName === 'défaut') {
      return {
        ...family,
        tags: family.tags.filter((tag) => !environmentTags?.some((envTag) => envTag.name === tag.name)),
      }
    }

    return family
  })

  await prismaClient.emissionSourceTagFamily.createMany({
    data: familyTagsToCreate.map((item) => ({
      name: item.familyName,
      studyId,
    })),
  })

  const studyFamilyTags = await prismaClient.emissionSourceTagFamily.findMany({ where: { studyId } })

  await prismaClient.emissionSourceTag.createMany({
    data: tagsToCreate.flatMap((d) => {
      return d.tags
        .map((tag) => ({
          name: tag.name,
          color: tag.color,
          familyId: studyFamilyTags.find((family) => family.name === d.familyName)?.id ?? '',
        }))
        .filter((tag) => tag.familyId !== '')
    }),
  })

  return prismaClient.emissionSourceTagFamily.findMany({
    where: { id: { in: studyFamilyTags.map((family) => family.id) } },
    select: { id: true, name: true, emissionSourceTags: { select: { id: true, name: true } } },
  })
}
