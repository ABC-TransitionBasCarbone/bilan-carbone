import { Environment } from '@abc-transitionbascarbone/common/db/enums'
import { getEnvRoute } from '@abc-transitionbascarbone/common/utils/environments'

export const getEnvResetLink = (path: string, token: string, env?: Environment) => {
  const route = getEnvRoute(path, env)

  return `${process.env.NEXTAUTH_URL}${route}/${token}`
}
