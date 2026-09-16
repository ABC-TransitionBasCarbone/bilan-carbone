import { Environment } from '@abc-transitionbascarbone/db-common/enums'

type ClientEnvKey = 'SUPPORT_EMAIL'

const CLIENT_ENV_DEFAULT: Record<ClientEnvKey, string> = {
  SUPPORT_EMAIL: process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? '',
}

const CLIENT_ENV_BY_ENV: Partial<Record<Environment, Partial<Record<ClientEnvKey, string>>>> = {
  CUT: {
    SUPPORT_EMAIL: process.env.NEXT_PUBLIC_CUT_SUPPORT_EMAIL,
  },
  CLICKSON: {
    SUPPORT_EMAIL: process.env.NEXT_PUBLIC_CLICKSON_SUPPORT_EMAIL,
  },
  TILT: {
    SUPPORT_EMAIL: process.env.NEXT_PUBLIC_TILT_SUPPORT_EMAIL,
  },
}

export const getEnvVarClient = (key: ClientEnvKey, environment: Environment = Environment.BC) => {
  return CLIENT_ENV_BY_ENV[environment]?.[key] ?? CLIENT_ENV_DEFAULT[key] ?? ''
}

export const useTranslatedLinks = (environment: Environment) =>
  environment === Environment.BC || environment === Environment.TILT
