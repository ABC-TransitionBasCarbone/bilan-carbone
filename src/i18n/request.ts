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

  let commonMessages = {}
  let bcMessages = {}

  try {
    commonMessages = (await import(`./translations/${locale}/common.json`)).default
  } catch {
    console.log(`No common translation file for locale: ${locale}, falling back to default`)
    commonMessages = (await import(`./translations/${Locale.EN}/common.json`)).default
  }

  try {
    bcMessages = (await import(`./translations/${locale}/bc.json`)).default
  } catch {
    console.log(`No bc translation file for locale: ${locale}, falling back to default`)
    bcMessages = (await import(`./translations/${Locale.EN}/bc.json`)).default
  }
  const baseMessages = mergeObjects({}, commonMessages, bcMessages)

  if (!environment || environment === Environment.BC) {
    return {
      locale,
      messages: baseMessages,
    }
  }

  const envLower = environment.toLocaleLowerCase()
  const overrideFilePath = path.join(process.cwd(), 'src/i18n/translations', `${locale}/${envLower}.json`)

  let overrideMessages = {}
  if (fs.existsSync(overrideFilePath)) {
    overrideMessages = JSON.parse(fs.readFileSync(overrideFilePath, 'utf-8'))
  } else {
    console.log(`No translation files at: ${overrideFilePath}`)
  }

  let publicodesRules = {}
  try {
    publicodesRules = (await import(`./translations/${locale}/publicodes/${envLower}-rules.json`)).default
  } catch {
    console.log(`No publicodes rules translation file for locale: ${locale} and environment: ${environment}`)
  }

  let publicodesLayout = {}
  try {
    publicodesLayout = (await import(`./translations/${locale}/publicodes/${envLower}-layout.json`)).default
  } catch {
    console.log(`No publicodes layout translation file for locale: ${locale} and environment: ${environment}`)
  }

  return {
    locale,
    messages: mergeObjects({}, baseMessages, overrideMessages, publicodesRules, publicodesLayout),
  }
})
