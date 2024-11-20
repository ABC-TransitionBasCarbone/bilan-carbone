import { Prisma } from '@prisma/client'
import { prismaClient } from './client'

export const getOrganizationById = (id: string) =>
  prismaClient.organization.findUnique({ where: { id }, include: { childs: true } })

export const getOrganizationByIdWithSites = (id: string) => {
  return prismaClient.organization.findUnique({
    where: { id },
    include: { childs: true, sites: { select: { name: true, etp: true, ca: true, id: true } } },
  })
}

export const getOrganizationUsers = (id: string) =>
  prismaClient.user.findMany({
    select: { email: true, firstName: true, lastName: true },
    where: { organizationId: id, isActive: true },
    orderBy: { email: 'asc' },
  })

export const getOrganizationWithSitesById = (id: string) =>
  prismaClient.organization.findUnique({
    where: { id },
    include: { sites: { select: { name: true, etp: true, ca: true, id: true } } },
  })

export const createOrganization = (organization: Prisma.OrganizationCreateInput) =>
  prismaClient.organization.create({
    data: organization,
  })
