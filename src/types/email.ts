import { EmailConfig, parseEnvConfig } from '@/lib/environment'
import { Environment } from '@prisma/client'

export type { EmailConfig } from '@/lib/environment'

export const EMAIL_CLIENT_CONFIGS: Record<Environment, EmailConfig> = {
  [Environment.BC]: parseEnvConfig(Environment.BC),
  [Environment.CUT]: parseEnvConfig(Environment.CUT),
  [Environment.TILT]: parseEnvConfig(Environment.TILT),
}
