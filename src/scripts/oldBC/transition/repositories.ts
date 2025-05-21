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

export const getExistingEmissionFactorsNames = async (transaction: Prisma.TransactionClient, oldBCIds: string[]) => {
  const existingObjects = await transaction.emissionFactor.findMany({
    where: {
      oldBCId: {
        in: oldBCIds,
      },
    },
    select: { id: true, oldBCId: true, source: true },
  })

  return existingObjects.reduce((map, currentExistingObject) => {
    if (currentExistingObject.oldBCId && currentExistingObject.source) {
      map.set(currentExistingObject.oldBCId, { id: currentExistingObject.id, name: currentExistingObject.source })
    }
    return map
  }, new Map<string, { name: string; id: string }>())
}

export const getExistingEmissionFactors = async (
  transaction: Prisma.TransactionClient,
  emissionSourceImportedIds: string[],
  emissionFactorOldBCIds: string[],
) => {
  const emissionFactors = await transaction.emissionFactor.findMany({
    where: { OR: [{ importedId: { in: emissionSourceImportedIds } }, { oldBCId: { in: emissionFactorOldBCIds } }] },
    include: {
      version: true,
    },
  })
  return emissionFactors
}
