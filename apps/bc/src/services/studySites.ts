import { mapCncToStudySite } from '@/utils/cnc'
import type { Prisma } from '@abc-transitionbascarbone/common/db'
import { prismaClient } from '../db/client.server'

export const updateStudySites = async (
  studyId: string,
  newStudySites: Prisma.StudySiteCreateManyInput[],
  deletedSiteIds: string[],
) =>
  prismaClient.$transaction(async (transaction) => {
    const operations = []
    if (deletedSiteIds.length) {
      await transaction.studyEmissionSource.deleteMany({ where: { studyId, studySiteId: { in: deletedSiteIds } } })
      operations.push(transaction.studySite.deleteMany({ where: { id: { in: deletedSiteIds }, studyId } }))
    }
    if (newStudySites.length) {
      const sitesWithCNC = await transaction.site.findMany({
        where: { id: { in: newStudySites.map((site) => site.siteId) } },
        include: {
          cnc: {
            select: {
              seances: true,
              entrees2024: true,
              entrees2023: true,
              semainesActivite: true,
              latitude: true,
              longitude: true,
            },
          },
        },
      })

      for (const studySite of newStudySites) {
        const cncData = sitesWithCNC.find((site) => site.id === studySite.siteId)?.cnc
        const create = cncData ? { ...studySite, ...mapCncToStudySite(cncData, studySite) } : studySite
        operations.push(
          transaction.studySite.upsert({
            where: { studyId_siteId: { studyId, siteId: studySite.siteId } },
            update: {
              ca: studySite.ca,
              etp: studySite.etp,
              volunteerNumber: studySite.volunteerNumber,
              beneficiaryNumber: studySite.beneficiaryNumber,
            },
            create,
          }),
        )
      }
    }
    return Promise.all(operations)
  })
