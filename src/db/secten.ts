import type { SectenInfo } from '@prisma/client'
import { prismaClient } from './client'

export const getSectenData = async (): Promise<SectenInfo[]> => {
  const latestVersion = await prismaClient.sectenVersion.findFirst({
    orderBy: { createdAt: 'desc' },
    include: {
      sectenInfos: {
        orderBy: { year: 'asc' },
      },
    },
  })

  if (!latestVersion) {
    return []
  }

  return latestVersion.sectenInfos
}
