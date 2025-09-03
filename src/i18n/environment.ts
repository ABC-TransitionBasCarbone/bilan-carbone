'use server'

import { Environment } from '@prisma/client'
import { cookies as getCookies } from 'next/headers'

const COOKIE_NAME = 'ENVIRONMENT'

export const getEnvironment = async (): Promise<Environment> => {
  const cookies = await getCookies()
  return (cookies.get(COOKIE_NAME)?.value as Environment) || Environment.BC
}

export const switchEnvironment = async (value: Environment) => {
  const cookies = await getCookies()
  cookies.set(COOKIE_NAME, value)
}
