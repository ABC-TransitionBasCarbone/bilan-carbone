import { getEnvVar } from '@/lib/environment'
import { Environment } from '@prisma/client'
import nodemailer from 'nodemailer'
import SMTPTransport from 'nodemailer/lib/smtp-transport'

const transposters = new Map<Environment, nodemailer.Transporter>()

export const getTransporter = (env: Environment) => {
  if (transposters.has(env)) {
    return transposters.get(env)!
  }

  const host = getEnvVar('MAIL_HOST', env)
  const port = getEnvVar('MAIL_PORT', env)
  const user = getEnvVar('MAIL_USER', env)
  const pass = getEnvVar('MAIL_PASSWORD', env)

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
