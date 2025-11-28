import { Environment } from '@prisma/client'

export const getEnvRoute = (path: string, env?: Environment) => {
  let base = ''
  switch (env) {
    case Environment.CUT:
      base = '/count'
      break
    case Environment.TILT:
      base = '/tilt'
      break
    case Environment.CLICKSON:
      base = '/clickson'
      break
    default:
      break
  }

  return `${base}/${path}`
}

export const getEnvResetLink = (path: string, token: string, env?: Environment) => {
  const route = getEnvRoute(path, env)

  return `${process.env.NEXTAUTH_URL}${route}/${token}`
}

export const getActivationInvitationLink = (email: string, env?: Environment) => {
  const route = getEnvRoute('activation', env)
  return `${process.env.NEXTAUTH_URL}${route}?email=${email}`
}
