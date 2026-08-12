import { Environment, Role } from "../db-common/src/generated/prisma/enums"
import { RoleBcOrMip } from "./types"

export const canBeUntrainedRole = (role: RoleBcOrMip, environment: Environment) => {
  if (environment === Environment.CUT || environment === Environment.MIP) {
    return true
  }

  const untrainedRoles = [Role.GESTIONNAIRE, Role.DEFAULT] as Role[]

  return untrainedRoles.includes(role)
}
