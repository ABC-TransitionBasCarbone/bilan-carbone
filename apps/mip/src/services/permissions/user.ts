import { Role } from '@abc-transitionbascarbone/db-common/enums'

export const canEditSelfRole = (userRole: Role) => userRole === Role.ADMIN || userRole === Role.GESTIONNAIRE
