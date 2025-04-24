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
