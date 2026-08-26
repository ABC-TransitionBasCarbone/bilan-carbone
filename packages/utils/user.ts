import { Environment, Role } from '@abc-transitionbascarbone/db-common/enums'
import { RoleBcOrMip } from './types'
import { isSimplified } from './environments'

export const canBeUntrainedRole = (role: RoleBcOrMip, environment: Environment) => {
  if (isSimplified(environment) || environment === Environment.MIP) {
    return true
  }

  const untrainedRoles = [Role.GESTIONNAIRE, Role.DEFAULT] as RoleBcOrMip[]

  return untrainedRoles.includes(role)
}
