import { Role } from '@prisma/client'

export const getCutRoleFromBase = (role: Role): Role => {
  const cutRoles = {
    [Role.ADMIN]: Role.ADMIN,
    [Role.GESTIONNAIRE]: Role.ADMIN,
    [Role.COLLABORATOR]: Role.DEFAULT,
    [Role.DEFAULT]: Role.DEFAULT,
    [Role.SUPER_ADMIN]: Role.ADMIN,
  }

  return cutRoles[role] || Role.DEFAULT
}
