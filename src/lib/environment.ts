import { Environment } from '@prisma/client'
import { z } from 'zod'

export const EmailConfigSchema = z.object({
  MAIL_HOST: z.string().min(1, 'MAIL_HOST is missing'),
  MAIL_PORT: z.coerce.number().int().positive(),
  MAIL_USER: z.string().email('MAIL_USER must be a valid email'),
  MAIL_PASSWORD: z.string().min(1, 'MAIL_PASSWORD is missing'),
  CONTACT_FORM_URL: z.string().url('CONTACT_FORM_URL must be a valid URL').optional(),
  SUPPORT_EMAIL: z.string().email('SUPPORT_EMAIL must be a valid email').optional(),
})

export const SharedEnvSchema = z.object({
  NEXTAUTH_URL: z.string().url('NEXTAUTH_URL must be a valid URL'),
})

export const sharedEnv = SharedEnvSchema.parse(process.env)

const keys = ['MAIL_HOST', 'MAIL_PORT', 'MAIL_USER', 'MAIL_PASSWORD', 'SUPPORT_EMAIL', 'CONTACT_FORM_URL'] as const

export type EmailConfig = {
  mailHost: string
  mailPort: number
  mailUser: string
  mailPassword: string
  baseUrl: string
  supportEmail: string
  contactFormUrl: string
}

export const parseEnvConfig = (envName: Environment): EmailConfig => {
  const prefix = envName.toUpperCase()
  const raw: Record<string, unknown> = {}

  for (const key of keys) {
    const fullKey = `${prefix}_${key}`
    let value = process.env[fullKey]

    if (!value) {
      // Try to get the default value from the shared environment
      value = process.env[key]
    }

    if (!value) {
      throw new Error(`❌ Missing env var: ${key}`)
    }
    raw[key] = value
  }

  const parsed = EmailConfigSchema.parse(raw)

  return {
    mailHost: parsed.MAIL_HOST,
    mailPort: parsed.MAIL_PORT,
    mailUser: parsed.MAIL_USER,
    mailPassword: parsed.MAIL_PASSWORD,
    baseUrl: sharedEnv.NEXTAUTH_URL,
    supportEmail: parsed.SUPPORT_EMAIL || parsed.MAIL_USER,
    contactFormUrl: parsed.CONTACT_FORM_URL || 'https://abc-transitionbascarbone.fr/contact-et-hotline',
  }
}
