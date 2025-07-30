import { sharedEmailEnv } from '@/lib/environment'
import { Environment } from '@prisma/client'

export type EmailClientConfig = {
  mailHost: string
  mailPort: number
  mailUser: string
  mailPassword: string
  baseUrl: string
  supportEmail: string
}

export const defaultEmailConfig: EmailClientConfig = {
  mailHost: sharedEmailEnv.MAIL_HOST,
  mailPort: sharedEmailEnv.MAIL_PORT,
  mailUser: sharedEmailEnv.MAIL_USER,
  mailPassword: sharedEmailEnv.MAIL_PASSWORD,
  baseUrl: sharedEmailEnv.NEXTAUTH_URL,
  supportEmail: sharedEmailEnv.MAIL_USER,
}

export const EMAIL_CLIENT_CONFIGS: Record<Environment, EmailClientConfig> = {
  /**
   * TODO: Replace defaultEmailConfig by parseClientEnvConfig(Environment.XX)
   * to use new smpt config
   */
  [Environment.BC]: defaultEmailConfig,
  [Environment.CUT]: defaultEmailConfig,
  [Environment.TILT]: defaultEmailConfig,
}
