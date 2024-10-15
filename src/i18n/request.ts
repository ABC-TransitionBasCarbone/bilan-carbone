'use server'

import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'
import { defaultLocale, LocaleType } from './config'

const COOKIE_NAME = 'NEXT_LOCALE'

export const getLocale = async (): Promise<LocaleType> => {
  return (cookies().get(COOKIE_NAME)?.value as LocaleType) || defaultLocale
}

export const switchLocale = (value: LocaleType) => {
  cookies().set(COOKIE_NAME, value)
}

export default getRequestConfig(async () => {
  // Provide a static locale, fetch a user setting,
  // read from `cookies()`, `headers()`, etc.
  const locale = await getLocale()
  return {
    locale,
    messages: (await import(`./${locale}.json`)).default,
  }
})
