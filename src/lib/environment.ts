import { Environment } from '@prisma/client'
import { z } from 'zod'

export const SharedEmailEnvSchema = z.object({
  MAIL_HOST: z.string().min(1, 'MAIL_HOST is missing'),
  MAIL_PORT: z.coerce.number().int().positive(),
  MAIL_USER: z.string().email('MAIL_USER must be a valid email'),
  MAIL_PASSWORD: z.string().min(1, 'MAIL_PASSWORD is missing'),
  NEXTAUTH_URL: z.string().url('NEXTAUTH_URL must be a valid URL'),
})

export type SharedEmailEnv = z.infer<typeof SharedEmailEnvSchema>

export const sharedEmailEnv = SharedEmailEnvSchema.parse(process.env)

const keys = ['MAIL_HOST', 'MAIL_PORT', 'MAIL_USER', 'MAIL_PASSWORD', 'BASE_URL', 'SUPPORT_EMAIL'] as const

export const parseClientEnvConfig = (envName: Environment): SharedEmailEnv => {
  const prefix = envName.toUpperCase()
  const raw: Record<string, unknown> = {}

  for (const key of keys) {
    const fullKey = `${prefix}_${key}`
    const value = process.env[fullKey]
    if (!value) {
      throw new Error(`❌ Missing env var: ${fullKey}`)
    }
    raw[key] = value
  }

  return SharedEmailEnvSchema.parse(raw)
}
