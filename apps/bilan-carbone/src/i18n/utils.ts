'use server'
import { mergeObjects } from '@/utils/object'
import { Environment } from '@abc-transitionbascarbone/db-common/enums'
import fs from 'fs'
import path from 'path'
import { Locale, LocaleType } from './config'

export const getMessages = async (locale: LocaleType, environment?: Environment) => {
  let commonMessages = {}
  let bcMessages = {}

  try {
    commonMessages = (await import(`@repo/i18n/${locale}/common.json`)).default
  } catch {
    console.log(`No common translation file for locale: ${locale}, falling back to default`)
    commonMessages = (await import(`@repo/i18n/${Locale.EN}/common.json`)).default
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
}
