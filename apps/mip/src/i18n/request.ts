import { getRequestConfig } from 'next-intl/server'
import { Locale } from './config'

export default getRequestConfig(async () => {
  const locale = Locale.FR

  const commonMessages = await import(`./translations/${locale}/common.json`).then((m) => m.default).catch(() =>
    import(`./translations/${Locale.FR}/common.json`).then((m) => m.default),
  )

  const mipMessages = await import(`./translations/${locale}/mip.json`).then((m) => m.default).catch(() =>
    import(`./translations/${Locale.FR}/mip.json`).then((m) => m.default),
  )

  return {
    locale,
    messages: { ...commonMessages, ...mipMessages },
  }
})
