import { getAllEmissions } from '@/db/emissions'

export const getEmissions = async (locale: string) => {
  const emissions = await getAllEmissions()

  return emissions.map((emission) => ({
    ...emission,
    metaData: emission.metaData.find((metadata) => metadata.language === locale),
  }))
}

export type EmissionWithMetaData = AsyncReturnType<typeof getEmissions>[0]
