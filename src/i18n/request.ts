import { mergeObjects } from '@/utils/object'
import { Environment } from '@prisma/client'
import fs from 'fs'
import { getRequestConfig } from 'next-intl/server'
import path from 'path'
import { Locale } from './config'
import { getEnvironment } from './environment'
import { getLocale } from './locale'

export default getRequestConfig(async () => {
  // Provide a static locale, fetch a user setting,
  // read from `cookies()`, `headers()`, etc.
  const environment = await getEnvironment()

  const locale = environment === Environment.CUT ? Locale.FR : await getLocale()

  const commonMessages = (await import(`./translations/${locale}/common.json`)).default
  const bcMessages = (await import(`./translations/${locale}/bc.json`)).default
  const baseMessages = mergeObjects({}, commonMessages, bcMessages)

  if (!environment || environment === Environment.BC) {
    return {
      locale,
      messages: baseMessages,
    }
  }

  const overrideFilePath = path.join(
    process.cwd(),
    'src/i18n/translations',
    `${locale}/${environment.toLocaleLowerCase()}.json`,
  )
  let overrideMessages = {}
  if (fs.existsSync(overrideFilePath)) {
    overrideMessages = JSON.parse(fs.readFileSync(overrideFilePath, 'utf-8'))
  } else {
    console.log(`No translation files at: ${overrideFilePath}`)
  }

  return {
    locale,
    messages: mergeObjects({}, baseMessages, overrideMessages),
  }
})
