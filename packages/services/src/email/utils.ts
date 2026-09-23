import { Environment } from '@abc-transitionbascarbone/db-common/enums'
import { getEnvRoute } from '@abc-transitionbascarbone/utils/environments'


export const getEnvResetLink = (path: string, token: string, env?: Environment) => {
  const route = getEnvRoute(path, env)

  return `${process.env.NEXTAUTH_URL}${route}/${token}`
}
