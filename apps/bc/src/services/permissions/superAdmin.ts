import { dbActualizedAuth } from '@/services/auth'
import { Role } from '@abc-transitionbascarbone/common/db/enums'
import { NOT_AUTHORIZED } from '@abc-transitionbascarbone/common/services/permissions/check'

export const requireSuperAdmin = async (functionName: string) => {
  const session = await dbActualizedAuth()
  if (!session?.user || session.user.role !== Role.SUPER_ADMIN) {
    console.error(`${functionName}: NOT_AUTHORIZED`, {
      userId: session?.user?.id ?? 'anonymous',
      accountId: session?.user?.accountId,
    })
    throw new Error(NOT_AUTHORIZED)
  }
  return session.user
}
