import { getLocalesForEnv } from '@/services/permissions/environment'
import { getRequestConfig } from 'next-intl/server'
import { getEnvironment } from './environment'
import { getLocale } from './locale'
import { getMessages } from './utils'

export default getRequestConfig(async () => {
  // Provide a static locale, fetch a user setting,
  // read from `cookies()`, `headers()`, etc.
  const environment = await getEnvironment()
  const localesForEnv = getLocalesForEnv(environment)
  const locale = await getLocale()

  const localeForEnv = localesForEnv.includes(locale) ? locale : localesForEnv[0]

  return getMessages(localeForEnv, environment)
})
