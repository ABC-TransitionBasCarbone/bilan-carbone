'use server'

import { defaultLocale, LocaleType } from '@abc-transitionbascarbone/i18n/config'
import { cookies as getCookies } from 'next/headers'

const COOKIE_NAME = 'NEXT_LOCALE'

export const getLocale = async (): Promise<LocaleType> => {
  const cookies = await getCookies()
  return (cookies.get(COOKIE_NAME)?.value as LocaleType) || defaultLocale
}

export const switchLocale = async (value: LocaleType) => {
  const cookies = await getCookies()
  cookies.set(COOKIE_NAME, value)
}
