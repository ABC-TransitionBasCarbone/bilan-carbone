import { getAccountById } from '@/db/account'
import { NOT_AUTHORIZED } from '@abc-transitionbascarbone/services/permissions/check'
import { auth } from '../auth'

export const getAuthenticatedAccount = async () => {
  const session = await auth()
  if (!session?.user) {
    throw new Error(NOT_AUTHORIZED)
  }

  const account = await getAccountById(session.user.accountId)
  if (!account?.organizationVersionId || !account.organizationVersion) {
    throw new Error(NOT_AUTHORIZED)
  }

  // This way TS knows that the organizationVersion is not null
  return {
    ...account,
    organizationVersionId: account.organizationVersionId,
    organizationVersion: account.organizationVersion,
  }
}
