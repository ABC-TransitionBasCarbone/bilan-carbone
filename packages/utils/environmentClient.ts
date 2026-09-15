import { Environment } from '@abc-transitionbascarbone/db-common/enums'

type ClientEnvKey = 'SUPPORT_EMAIL' | 'FAQ_LINK' | 'EN_FAQ_LINK' | 'ABC_SITE'

const CLIENT_ENV_DEFAULT: Record<ClientEnvKey, string> = {
  SUPPORT_EMAIL: process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? '',
  FAQ_LINK: process.env.NEXT_PUBLIC_FAQ_LINK ?? '',
  EN_FAQ_LINK: process.env.NEXT_PUBLIC_EN_FAQ_LINK ?? '',
  ABC_SITE: process.env.NEXT_PUBLIC_ABC_SITE ?? '',
}

const CLIENT_ENV_BY_ENV: Partial<Record<Environment, Partial<Record<ClientEnvKey, string>>>> = {
  BC: {
    SUPPORT_EMAIL: process.env.NEXT_PUBLIC_BC_SUPPORT_EMAIL,
    FAQ_LINK: process.env.NEXT_PUBLIC_BC_FAQ_LINK,
    ABC_SITE: process.env.NEXT_PUBLIC_BC_ABC_SITE,
  },
  CUT: {
    SUPPORT_EMAIL: process.env.NEXT_PUBLIC_CUT_SUPPORT_EMAIL,
    FAQ_LINK: process.env.NEXT_PUBLIC_CUT_FAQ_LINK,
    ABC_SITE: process.env.NEXT_PUBLIC_CUT_ABC_SITE,
  },
  CLICKSON: {
    SUPPORT_EMAIL: process.env.NEXT_PUBLIC_CLICKSON_SUPPORT_EMAIL,
    FAQ_LINK: process.env.NEXT_PUBLIC_CLICKSON_FAQ_LINK,
    ABC_SITE: process.env.NEXT_PUBLIC_CLICKSON_ABC_SITE,
  },
  TILT: {
    SUPPORT_EMAIL: process.env.NEXT_PUBLIC_TILT_SUPPORT_EMAIL,
    FAQ_LINK: process.env.NEXT_PUBLIC_TILT_FAQ_LINK,
    ABC_SITE: process.env.NEXT_PUBLIC_TILT_ABC_SITE,
  },
}

export const getEnvVarClient = (key: ClientEnvKey, environment: Environment = Environment.BC) => {
  return CLIENT_ENV_BY_ENV[environment]?.[key] ?? CLIENT_ENV_DEFAULT[key] ?? ''
}

export const getFaqLinkClient = (environment: Environment, locale?: string) => {
  if (locale === 'en' && (environment === Environment.BC || environment === Environment.TILT)) {
    return getEnvVarClient('EN_FAQ_LINK', environment)
  }

  return getEnvVarClient('FAQ_LINK', environment)
}
