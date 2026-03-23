import { getEnvVar } from '@/lib/environment'
import { Environment } from '@repo/db-common/enums'
import nodemailer from 'nodemailer'
import SMTPTransport from 'nodemailer/lib/smtp-transport'

const transposters = new Map<Environment, nodemailer.Transporter>()

export const getTransporter = async (env: Environment) => {
  if (transposters.has(env)) {
    return transposters.get(env)!
  }

  const host = await getEnvVar('MAIL_HOST', env)
  const port = await getEnvVar('MAIL_PORT', env)
  const user = await getEnvVar('MAIL_USER', env)
  const pass = await getEnvVar('MAIL_PASSWORD', env)

  const transporter = nodemailer.createTransport({
    host,
    port: parseInt(port, 10),
    auth: {
      user,
      pass,
    },
  } as SMTPTransport.Options)

  transposters.set(env, transporter)
  return transporter
}
