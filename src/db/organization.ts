import { prismaClient } from './client'

export const getOrganizationById = (id: string) =>
  prismaClient.organization.findUnique({ where: { id }, include: { childs: true } })

export const getOrganizationUsers = (id: string) =>
  prismaClient.user.findMany({
    select: { email: true, firstName: true, lastName: true },
    where: { organizationId: id, isActive: true },
    orderBy: { email: 'asc' },
  })
