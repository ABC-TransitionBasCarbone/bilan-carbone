'use server'

import { cookies as getCookies } from 'next/headers'
import { defaultLocale, LocaleType } from './config'

const COOKIE_NAME = 'NEXT_LOCALE'

export const getLocale = async (): Promise<LocaleType> => {
  const cookies = await getCookies()
  return (cookies.get(COOKIE_NAME)?.value as LocaleType) || defaultLocale
}

export const switchLocale = async (value: LocaleType) => {
  const cookies = await getCookies()
  cookies.set(COOKIE_NAME, value)
}
