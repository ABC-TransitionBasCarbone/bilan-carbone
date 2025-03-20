import { BASE } from '@/store/AppEnvironment'
import { mergeObjects } from '@/utils/object'
import fs from 'fs'
import { getRequestConfig } from 'next-intl/server'
import path from 'path'
import { getEnvironment } from './environment'
import { getLocale } from './locale'

export default getRequestConfig(async () => {
  // Provide a static locale, fetch a user setting,
  // read from `cookies()`, `headers()`, etc.
  const locale = await getLocale()
  const environment = await getEnvironment()
  const baseMessages = (await import(`./${locale}.json`)).default

  if (!environment || environment === BASE) {
    return {
      locale,
      messages: baseMessages,
    }
  }

  const overrideFilePath = path.join(process.cwd(), 'src/i18n', `${locale}-${environment}.json`)
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
