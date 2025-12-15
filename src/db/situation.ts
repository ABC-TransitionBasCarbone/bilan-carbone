import { PUBLICODES_ENGINE_VERSION } from '@/constants/versions'
import { Situation as SituationSchema } from '@prisma/client'
import { InputJsonValue } from '@prisma/client/runtime/library'
import { prismaClient } from './client'

export async function getSituationByStudySite(studySiteId: string): Promise<SituationSchema | null> {
  return await prismaClient.situation.findUnique({
    where: { studySiteId },
  })
}

export async function upsertSituationFields(
  studySiteId: string,
  fieldsToUpdate: Record<string, unknown>,
): Promise<void> {
  const existing = await getSituationByStudySite(studySiteId)
  if (!existing) return

  const currentSituation = (existing.situation ?? {}) as Record<string, unknown>
  const updatedSituation = { ...currentSituation, ...fieldsToUpdate }

  await upsertSituation(studySiteId, updatedSituation as InputJsonValue, existing.modelVersion)
}

export async function upsertSituation(
  studySiteId: string,
  situation: InputJsonValue,
  modelVersion: string,
): Promise<SituationSchema> {
  return await prismaClient.situation.upsert({
    where: { studySiteId },
    create: {
      studySiteId,
      situation,
      modelVersion,
      publicodesVersion: PUBLICODES_ENGINE_VERSION,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    update: {
      situation,
      updatedAt: new Date(),
      modelVersion,
      publicodesVersion: PUBLICODES_ENGINE_VERSION,
    },
  })
}
