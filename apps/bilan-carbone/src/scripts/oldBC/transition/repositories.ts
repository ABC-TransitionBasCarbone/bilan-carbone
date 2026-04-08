import { Prisma } from '@prisma/client'

export interface Delegate {
  findMany(args?: object): Promise<{ id: string; oldBCId: string | null }[]>
}

export async function getExistingObjectsIds(delegate: Delegate, oldBCIds: string[]) {
  const existingObjects = await delegate.findMany({
    where: {
      oldBCId: {
        in: oldBCIds,
      },
    },
    select: { id: true, oldBCId: true },
  })

  return existingObjects.reduce((map, currentExistingObject) => {
    if (currentExistingObject.oldBCId) {
      map.set(currentExistingObject.oldBCId, currentExistingObject.id)
    }
    return map
  }, new Map<string, string>())
}

export const getExistingSitesIds = async (transaction: Prisma.TransactionClient, sitesOldBCIds: string[]) => {
  return getExistingObjectsIds(transaction.site, sitesOldBCIds)
}

const formatEmissionFactorName = (metaData: {
  title: string | null
  attribute: string | null
  frontiere: string | null
}) => {
  if (metaData.title && metaData.attribute && metaData.frontiere) {
    return `${metaData.title} ${metaData.attribute} ${metaData.frontiere}`
  }
  if (metaData.title && metaData.attribute) {
    return `${metaData.title} ${metaData.attribute}`
  }
  if (metaData.title) {
    return metaData.title
  }
  return ''
}

export const getExistingEmissionFactorsNames = async (transaction: Prisma.TransactionClient, oldBCIds: string[]) => {
  const existingObjects = await transaction.emissionFactor.findMany({
    where: {
      OR: [{ importedId: { in: oldBCIds } }, { oldBCId: { in: oldBCIds } }],
    },
    select: {
      id: true,
      oldBCId: true,
      importedId: true,
      metaData: { select: { language: true, title: true, attribute: true, frontiere: true } },
    },
  })

  return existingObjects.reduce((map, currentExistingObject) => {
    const frenchMetadata = currentExistingObject.metaData.find((meta) => meta.language === 'fr')

    const feId = currentExistingObject.oldBCId || currentExistingObject.importedId
    if (feId && currentExistingObject.metaData && frenchMetadata) {
      map.set(feId, {
        id: currentExistingObject.id,
        name: formatEmissionFactorName(frenchMetadata),
      })
    }

    return map
  }, new Map<string, { name: string; id: string }>())
}

export const getExistingEmissionFactors = async (
  transaction: Prisma.TransactionClient,
  importedIds: string[],
  oldBCIds: string[],
) => {
  const emissionFactors = await transaction.emissionFactor.findMany({
    where: { OR: [{ importedId: { in: importedIds } }, { oldBCId: { in: oldBCIds } }] },
    include: {
      version: true,
    },
  })
  return emissionFactors
}
