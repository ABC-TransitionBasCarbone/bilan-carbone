import { Locale } from '@abc-transitionbascarbone/i18n/config'
import { getRequestConfig } from 'next-intl/server'
import { getLocale } from './locale'

export default getRequestConfig(async () => {
  const locale = await getLocale()

  const commonMessages = await import(`../../../../packages/i18n/translations/${locale}/common.json`)
    .then((m) => m.default)
    .catch(() => import(`../../../../packages/i18n/translations/${Locale.FR}/common.json`).then((m) => m.default))

  const mipMessages = await import(`./translations/${locale}/mip.json`)
    .then((m) => m.default)
    .catch(() => import(`./translations/${Locale.FR}/mip.json`).then((m) => m.default))

  const mipRulesMessages = await import(`../../../../packages/i18n/translations/${locale}/publicodes/mip-rules.json`)
    .then((m) => m.default)
    .catch(() =>
      import(`../../../../packages/i18n/translations/${Locale.FR}/publicodes/mip-rules.json`).then((m) => m.default),
    )

  return {
    locale,
    messages: { ...commonMessages, ...mipMessages, ...mipRulesMessages },
  }
})
