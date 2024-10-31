import { prismaClient } from './client'

export const getOrganizationById = (id: string) =>
  prismaClient.organization.findUnique({ where: { id }, include: { childs: true } })

export const getOrganizationUsers = (id: string) =>
  prismaClient.user.findMany({ select: { email: true }, where: { organizationId: id }, orderBy: { email: 'asc' } })
