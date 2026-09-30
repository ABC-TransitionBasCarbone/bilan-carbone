import { RoleMip } from '@abc-transitionbascarbone/db/enums'
import { UserSession } from 'next-auth'

export const isAdmin = (userRole: RoleMip) => userRole === RoleMip.ADMIN || userRole === RoleMip.SUPER_ADMIN
export const canEditMemberRole = (account: UserSession) => isAdmin(account.role)
