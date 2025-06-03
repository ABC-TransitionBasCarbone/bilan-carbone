import { Prisma } from '@prisma/client'
import { prismaClient } from './client'

export const addSite = (site: Prisma.SiteCreateInput) =>
  prismaClient.site.create({
    data: site,
    select: {
      id: true,
    },
  })
