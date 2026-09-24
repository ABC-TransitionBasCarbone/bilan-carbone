import { Environment, Role } from '@abc-transitionbascarbone/db-common/enums'
import { isSimplified } from './environments'
import { RoleBcOrMip } from './types'

export const canBeUntrainedRole = (role: RoleBcOrMip, environment: Environment) => {
  if (isSimplified(environment) || environment === Environment.MIP) {
    return true
  }

  const untrainedRoles = [Role.GESTIONNAIRE, Role.DEFAULT] as RoleBcOrMip[]

  return untrainedRoles.includes(role)
}
