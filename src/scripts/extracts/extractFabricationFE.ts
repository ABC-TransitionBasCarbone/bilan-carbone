import { EmissionFactorPartType, PrismaClient } from '@prisma/client'
import { writeFileSync } from 'fs'

// One shot script to get all FE with fabrication part

const prisma = new PrismaClient()

const findFEs = async () => {
  const FEs = await prisma.emissionFactor.findMany({
    select: {
      subPosts: true,
      metaData: {
        select: {
          emissionFactorId: true,
          title: true,
          language: true,
        },
      },
    },
    where: {
      emissionFactorParts: {
        some: {
          type: EmissionFactorPartType.Fabrication,
        },
      },
    },
  })

  const mappedFes = FEs.flatMap((fe) =>
    fe.metaData.map((metadata) => ({
      emissionFactorId: metadata.emissionFactorId,
      title: metadata.title,
      lang: metadata.language,
    })),
  ).filter((fe) => fe.lang === 'fr')

  const uniqueFes = Array.from(new Map(mappedFes.map((fe) => [fe.title, fe])).values())

  const headers = ['emissionFactorId', 'title']

  const csvContent = [
    headers.join(','),
    ...uniqueFes.map((row) =>
      headers
        .map((header) => `"${(row as Record<string, string | null>)[header]?.toString().replace(/"/g, '""') ?? ''}"`)
        .join(','),
    ),
  ].join('\n')

  writeFileSync('emission_factors_fabrication.csv', csvContent, 'utf-8')

  console.log(uniqueFes.length, 'résultats')
  console.log('CSV généré : emission_factors_fabrication.csv')
}

findFEs()
