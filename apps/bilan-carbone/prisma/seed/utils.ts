import { Environment, Role } from '@abc-transitionbascarbone/db-common/enums'

export const getCutRoleFromBase = (role: Role): Role => {
  switch (role) {
    case Role.ADMIN:
    case Role.GESTIONNAIRE:
    case Role.SUPER_ADMIN:
      return Role.ADMIN
    default:
      return Role.DEFAULT
  }
}

export const getClicksonRoleFromBase = (role: Role): Role => {
  switch (role) {
    case Role.ADMIN:
    case Role.GESTIONNAIRE:
    case Role.SUPER_ADMIN:
      return Role.ADMIN
    default:
      return Role.COLLABORATOR
  }
}

export const getRolesFromEnvironment = (environment: Environment, role: Role) => {
  switch (environment) {
    case Environment.CUT:
      return getCutRoleFromBase(role)
    case Environment.CLICKSON:
      return getClicksonRoleFromBase(role)
    default:
      return role
  }
}
