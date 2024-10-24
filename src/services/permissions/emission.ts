import { Emission, Import, User } from '@prisma/client'

export const canReadEmission = (user: User, emission: Pick<Emission, 'organizationId' | 'importedFrom'>) => {
  if (emission.importedFrom !== Import.Manual) {
    return true
  }

  return user.organizationId === emission.organizationId
}

export const canCreateEmission = () => {
  // For now everyone can create an FE
  return true
}
