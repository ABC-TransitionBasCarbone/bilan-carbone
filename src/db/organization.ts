import { prismaClient } from './client'

export const getOrganizationById = (id: string) =>
  prismaClient.organization.findUnique({ where: { id }, include: { childs: true } })
