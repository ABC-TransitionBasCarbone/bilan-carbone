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
