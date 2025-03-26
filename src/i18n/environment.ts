'use server'

import { defaultEnvironment, Environment } from '@/store/AppEnvironment'
import { cookies as getCookies } from 'next/headers'

const COOKIE_NAME = 'ENVIRONMENT'

export const getEnvironment = async (): Promise<Environment> => {
  const cookies = await getCookies()
  return (cookies.get(COOKIE_NAME)?.value as Environment) || defaultEnvironment
}

export const switchEnvironment = async (value: Environment) => {
  const cookies = await getCookies()
  cookies.set(COOKIE_NAME, value)
}
