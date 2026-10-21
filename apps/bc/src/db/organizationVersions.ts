import { prismaClient } from './client.server'

export const getOrganizationVersionsByIds = (organizationVersionIds: string[]) =>
  prismaClient.organizationVersion.findMany({
    where: { id: { in: organizationVersionIds } },
    select: {
      id: true,
      environment: true,
      parent: { select: { id: true, activatedLicence: true } },
      activatedLicence: true,
    },
  })
