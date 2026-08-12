import { Environment, Role } from "../db-common/src/generated/prisma/enums"

export const canBeUntrainedRole = (role: Role, environment: Environment) => {
  if (environment === Environment.CUT || environment === Environment.MIP) {
    return true
  }

  const untrainedRoles = [Role.GESTIONNAIRE, Role.DEFAULT] as Role[]

  return untrainedRoles.includes(role)
}
