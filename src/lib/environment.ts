import { Environment } from '@prisma/client'

export const getEnvVar = (key: string, environment: Environment = Environment.BC) => {
  const prefix = environment.toUpperCase()
  const possibleKeys = [`NEXT_PUBLIC_${prefix}_${key}`, `${prefix}_${key}`, `NEXT_PUBLIC_${key}`, key]

  for (const envKey of possibleKeys) {
    const value = process.env[envKey]
    if (value) {
      return value
    }
  }

  return ''
}
