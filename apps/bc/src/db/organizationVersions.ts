import { prismaClient } from './client.server'
import { OrganizationVersionCourseAccessSelect } from './organization.select'

export const getOrganizationVersionsByIds = (organizationVersionIds: string[]) =>
  prismaClient.organizationVersion.findMany({
    where: { id: { in: organizationVersionIds } },
    select: {
      ...OrganizationVersionCourseAccessSelect,
      id: true,
      environment: true,
      parent: { select: { id: true, activatedLicence: true } },
      activatedLicence: true,
    },
  })
