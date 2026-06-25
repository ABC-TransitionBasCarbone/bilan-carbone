import { Prisma } from '@abc-transitionbascarbone/db-common'
import { prismaClient } from './client.server'

export const getOrgNameByOrgVersionMipId = async (id: string | null) => {
  if (!id) {
    return null
  }

  const organizationVersionMip = await prismaClient.organizationVersionMip.findUnique({
    where: { id },
    select: { organization: { select: { name: true } } },
  })

  return organizationVersionMip?.organization?.name
}

export const createOrganizationWithVersionMip = async (
  organization: Prisma.OrganizationCreateInput,
  organizationVersionMip: Omit<Prisma.OrganizationVersionMipCreateInput, 'organization'>,
) => {
  const newOrganization = await prismaClient.organization.create({
    data: organization,
  })

  return prismaClient.organizationVersionMip.create({
    data: {
      ...organizationVersionMip,
      organization: { connect: { id: newOrganization.id } },
    },
  })
}
