import { Situation as SituationSchema } from '@prisma/client'
import { prismaClient } from './client'

export async function getSituationByStudySite(studySiteId: string): Promise<SituationSchema | null> {
  return await prismaClient.situation.findUnique({
    where: { studySiteId },
  })
}
