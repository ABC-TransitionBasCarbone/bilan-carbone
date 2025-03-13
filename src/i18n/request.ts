import { mergeObjects } from '@/utils/object'
import fs from 'fs'
import { getRequestConfig } from 'next-intl/server'
import path from 'path'
import { getLocale } from './locale'

export default getRequestConfig(async () => {
  // Provide a static locale, fetch a user setting,
  // read from `cookies()`, `headers()`, etc.
  const locale = await getLocale()
  const baseMessages = (await import(`./${locale}.json`)).default

  const tag = '' // ex tag='cut' TODO CUT: get tag dynamically
  if (!tag) {
    return {
      locale,
      messages: baseMessages,
    }
  }

  const overrideFilePath = path.join(process.cwd(), 'src/i18n', `${locale}-${tag}.json`)
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
