import { getAllValidEmissions } from '@/db/emissions'
import { auth } from './auth'

export const getEmissions = async (locale: string) => {
  const session = await auth()
  if (!session || !session.user) {
    return []
  }

  const emissions = await getAllValidEmissions(session.user.organizationId)

  return emissions.map((emission) => ({
    ...emission,
    metaData: emission.metaData.find((metadata) => metadata.language === locale),
  }))
}

export type EmissionWithMetaData = AsyncReturnType<typeof getEmissions>[0]
