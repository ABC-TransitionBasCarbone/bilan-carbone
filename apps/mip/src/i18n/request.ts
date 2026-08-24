import { Locale } from '@abc-transitionbascarbone/i18n/config'
import { isObject } from '@abc-transitionbascarbone/utils/object'
import { getRequestConfig } from 'next-intl/server'
import { getLocale } from './locale'

const deepMerge = (base: Record<string, unknown>, ...sources: Array<Record<string, unknown>>) => {
  for (const source of sources) {
    if (!isObject(source)) {
      continue
    }

    for (const [key, value] of Object.entries(source)) {
      const current = base[key]

      if (isObject(value)) {
        const target = isObject(current) ? current : {}
        base[key] = target
        deepMerge(target, value)
        continue
      }

      if (value !== undefined) {
        base[key] = value
      }
    }
  }

  return base
}

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
    messages: deepMerge(
      {},
      isObject(commonMessages) ? commonMessages : {},
      isObject(mipMessages) ? mipMessages : {},
      isObject(mipRulesMessages) ? mipRulesMessages : {},
    ),
  }
})
