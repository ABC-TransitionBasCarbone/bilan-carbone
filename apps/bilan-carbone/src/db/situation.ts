import { PUBLICODES_ENGINE_VERSION } from '@/constants/versions'
import type { InputJsonValue } from '@prisma/client/runtime/client'
import { Situation as SituationSchema } from '@repo/db-common'
import { prismaClient } from './client.server'

export async function getSituationByStudySite(studySiteId: string): Promise<SituationSchema | null> {
  return await prismaClient.situation.findUnique({
    where: { studySiteId },
  })
}

export async function getSituationsByStudySites(studySiteIds: string[]): Promise<SituationSchema[]> {
  return await prismaClient.situation.findMany({
    where: { studySiteId: { in: studySiteIds } },
  })
}

export async function updateSituationFields(
  studySiteId: string,
  fieldsToUpdate: Record<string, unknown>,
): Promise<void> {
  const existing = await getSituationByStudySite(studySiteId)
  if (!existing) {
    return
  }

  const currentSituation = (existing.situation ?? {}) as Record<string, unknown>
  const updatedSituation = { ...currentSituation, ...fieldsToUpdate }
  await prismaClient.situation.update({
    where: { studySiteId },
    data: {
      situation: updatedSituation as InputJsonValue,
      updatedAt: new Date(),
    },
  })
}

export async function upsertSituation(
  studySiteId: string,
  situation: InputJsonValue,
  listLayoutSituations: InputJsonValue,
  modelVersion: string,
): Promise<SituationSchema> {
  return await prismaClient.situation.upsert({
    where: { studySiteId },
    create: {
      studySiteId,
      situation,
      listLayoutSituations,
      modelVersion,
      publicodesVersion: PUBLICODES_ENGINE_VERSION,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    update: {
      situation,
      listLayoutSituations,
      updatedAt: new Date(),
      modelVersion,
      publicodesVersion: PUBLICODES_ENGINE_VERSION,
    },
  })
}
