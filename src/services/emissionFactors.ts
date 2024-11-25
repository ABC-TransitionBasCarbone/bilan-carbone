import { getAllValidEmissionFactors } from '@/db/emissionFactors'
import { auth } from './auth'

export const getEmissionFactors = async (locale: string) => {
  const session = await auth()
  if (!session || !session.user.organizationId) {
    return []
  }

  const emissionFactors = await getAllValidEmissionFactors(session.user.organizationId)

  return emissionFactors.map((emissionFactor) => ({
    ...emissionFactor,
    metaData: emissionFactor.metaData.find((metadata) => metadata.language === locale),
  }))
}

export type EmissionFactorWithMetaData = AsyncReturnType<typeof getEmissionFactors>[0]
