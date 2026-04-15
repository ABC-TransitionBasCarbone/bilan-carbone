import type { Prisma } from '@repo/db-common'
import { prismaClient } from './client.server'

export const addSite = async (site: Prisma.SiteCreateInput) =>
  prismaClient.site.create({
    data: site,
    select: {
      id: true,
    },
  })

export const updateStudySite = async (studySiteId: string, data: Prisma.StudySiteUpdateInput) =>
  prismaClient.studySite.update({
    where: { id: studySiteId },
    data,
  })

export const getStudySitesFromIds = async (studyId: string, siteIds: string[]) =>
  prismaClient.studySite.findMany({
    where: { studyId, id: { in: siteIds } },
    select: { id: true },
  })

export const getStudySitesByStudyId = async (studyId: string) =>
  prismaClient.studySite.findMany({
    where: { studyId },
    include: {
      site: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      site: {
        name: 'asc',
      },
    },
  })
