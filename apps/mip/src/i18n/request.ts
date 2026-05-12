import { getRequestConfig } from 'next-intl/server'
import { Locale } from './config'

export default getRequestConfig(async () => {
  const locale = Locale.FR

  const commonMessages = await import(`../../../../packages/i18n/translations/${locale}/common.json`)
    .then((m) => m.default)
    .catch(() => import(`../../../../packages/i18n/translations/${Locale.FR}/common.json`).then((m) => m.default))

  const mipMessages = await import(`./translations/${locale}/mip.json`)
    .then((m) => m.default)
    .catch(() => import(`./translations/${Locale.FR}/mip.json`).then((m) => m.default))

  let publicodesRules = {}
  try {
    publicodesRules = (await import(`../../../../packages/i18n/translations/${locale}/publicodes/mip-rules.json`))
      .default
  } catch {
    console.log(`No publicodes rules translation file for locale: ${locale}`)
  }

  // let publicodesLayout = {}
  // try {
  //   publicodesLayout = (
  //     await import(`../../../../packages/i18n/translations/${locale}/publicodes/mip-layout.json`)
  //   ).default
  // } catch {
  //   console.log(`No publicodes layout translation file for locale: ${locale}`)
  // }

  return {
    locale,
    messages: { ...commonMessages, ...mipMessages, ...publicodesRules },
  }
})
