import { prismaClient } from './client.server'

export const getOrgNameByOrgVersionMipId = async (id: string | null) => {
  if (!id) {
    return null
  }

  const organizationVersion = await prismaClient.organizationVersion.findUnique({
    where: { id },
    select: { organization: { select: { name: true } } },
  })

  return organizationVersion?.organization?.name
}
