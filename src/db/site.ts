import { Prisma } from '@prisma/client'
import { prismaClient } from './client'

export const addSite = (site: Prisma.SiteCreateInput) =>
  prismaClient.site.create({
    data: site,
    select: {
      id: true,
    },
  })

export const updateStudySite = (studySiteId: string, data: Prisma.StudySiteUpdateInput) =>
  prismaClient.studySite.update({
    where: { id: studySiteId },
    data,
  })
