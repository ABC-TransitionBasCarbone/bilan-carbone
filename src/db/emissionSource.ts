import { DefaultStudyTags } from '@/constants/studyTags'
import { Environment, Prisma } from '@prisma/client'
import { prismaClient } from './client'

export const getEmissionSourceById = (id: string) =>
  prismaClient.studyEmissionSource.findUnique({ where: { id }, include: { emissionSourceTags: true } })

export const createEmissionSourceOnStudy = (emissionSource: Prisma.StudyEmissionSourceCreateInput) =>
  prismaClient.studyEmissionSource.create({
    data: emissionSource,
  })

export const createEmissionSourcesOnStudy = (emissionSources: Prisma.StudyEmissionSourceCreateManyInput[]) =>
  prismaClient.studyEmissionSource.createMany({
    data: emissionSources,
  })

export const createEmissionSourcesWithReturn = (
  emissionSources: Prisma.StudyEmissionSourceCreateManyInput[],
  tx?: Prisma.TransactionClient,
) =>
  (tx ?? prismaClient).studyEmissionSource.createManyAndReturn({
    data: emissionSources,
    select: { id: true },
  })

export const getFamilyTagsForStudy = (studyId: string, tx?: Prisma.TransactionClient) =>
  (tx ?? prismaClient).studyTagFamily.findMany({
    where: { studyId },
    select: { id: true, name: true, tags: { select: { id: true, name: true } } },
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

export const createStudyTag = (tag: Prisma.StudyTagCreateInput) =>
  prismaClient.studyTag.create({
    data: tag,
  })

export const updateStudyTag = (id: string, data: Prisma.StudyTagUpdateInput) =>
  prismaClient.studyTag.update({
    where: { id },
    data,
  })

export const deleteStudyTag = (id: string) => prismaClient.studyTag.delete({ where: { id } })

export const getTagFamilyById = async (familyId: string) =>
  prismaClient.studyTagFamily.findUnique({ where: { id: familyId } })

export const upsertTagFamilyById = async (studyId: string, name: string, familyId?: string) =>
  familyId
    ? prismaClient.studyTagFamily.update({
        where: { id: familyId },
        data: { name },
      })
    : prismaClient.studyTagFamily.create({
        data: { name, studyId },
      })

export const removeTagFamilyById = async (familyId: string) => {
  await prismaClient.studyTag.deleteMany({ where: { familyId } })
  return prismaClient.studyTagFamily.delete({ where: { id: familyId } })
}

export const createTagFamilyAndRelatedTags = async (
  studyId: string,
  data: { familyName: string; tags: { name: string; color: string }[] }[],
  environment: Environment,
) => {
  const environmentTags = DefaultStudyTags[environment as keyof typeof DefaultStudyTags]

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

  await prismaClient.studyTagFamily.createMany({
    data: familyTagsToCreate.map((item) => ({
      name: item.familyName,
      studyId,
    })),
  })

  const studyFamilyTags = await prismaClient.studyTagFamily.findMany({ where: { studyId } })

  await prismaClient.studyTag.createMany({
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

  return prismaClient.studyTagFamily.findMany({
    where: { id: { in: studyFamilyTags.map((family) => family.id) } },
    select: { id: true, name: true, tags: { select: { id: true, name: true } } },
  })
}
