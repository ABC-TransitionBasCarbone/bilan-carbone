import { Environment } from '@abc-transitionbascarbone/db-common/enums'
import { Locale } from '@abc-transitionbascarbone/i18n/config'
import { getRequestConfig } from 'next-intl/server'
import { getEnvironment } from './environment'
import { getLocale } from './locale'
import { getMessages } from './utils'

export default getRequestConfig(async () => {
  // Provide a static locale, fetch a user setting,
  // read from `cookies()`, `headers()`, etc.
  const environment = await getEnvironment()

  const locale = environment === Environment.CUT ? Locale.FR : await getLocale()

  return getMessages(locale, environment)
})
