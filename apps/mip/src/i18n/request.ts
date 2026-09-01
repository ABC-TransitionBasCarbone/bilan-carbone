import { Locale } from '@abc-transitionbascarbone/i18n/config'
import { isObject, mergeObjects } from '@abc-transitionbascarbone/utils/object'
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

  // Only keep publicodes-units from mip-rules; questions/titles must come directly from the publicodes model
  const mipUnitsMessages =
    isObject(mipRulesMessages) && isObject((mipRulesMessages as Record<string, unknown>)['publicodes-units'])
      ? { 'publicodes-units': (mipRulesMessages as Record<string, unknown>)['publicodes-units'] }
      : {}

  return {
    locale,
    messages: mergeObjects(
      {},
      isObject(commonMessages) ? commonMessages : {},
      isObject(mipMessages) ? mipMessages : {},
      mipUnitsMessages,
    ),
  }
})
