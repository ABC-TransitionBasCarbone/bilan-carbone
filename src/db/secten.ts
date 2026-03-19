import type { SectenInfo, SectenVersion } from '@prisma/client'
import { prismaClient } from './client'

export const getLatestSectenVersion = async (): Promise<(SectenVersion & { sectenInfos: SectenInfo[] }) | null> => {
  return prismaClient.sectenVersion.findFirst({
    include: {
      sectenInfos: {
        orderBy: { year: 'asc' },
      },
    },
    orderBy: { year: 'desc' },
  })
}

export const getSectenData = async (versionId?: string): Promise<SectenInfo[]> => {
  if (versionId) {
    return prismaClient.sectenInfo.findMany({
      where: { versionId },
      orderBy: { year: 'asc' },
    })
  }

  const latestVersion = await prismaClient.sectenVersion.findFirst({
    orderBy: { year: 'desc' },
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
