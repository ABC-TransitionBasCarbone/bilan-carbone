import { getRequestConfig } from 'next-intl/server'
import { Locale } from './config'

export default getRequestConfig(async () => {
  const locale = Locale.FR

  const messages = {
    ...(await import(`./translations/fr/mip.json`)).default,
  }

  return {
    locale,
    messages,
  }
})
