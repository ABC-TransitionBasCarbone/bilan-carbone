import { AccountMipWithUserSelect } from './accountMip.select'
import { prismaClient } from './client.server'


export const getAccountMipById = (id: string) =>
  prismaClient.accountMip.findUnique({
    where: { id },
    select: AccountMipWithUserSelect,
  })