import { EMAIL_CLIENT_CONFIGS } from '@/types/email'
import { Environment } from '@prisma/client'
import nodemailer from 'nodemailer'
import SMTPTransport from 'nodemailer/lib/smtp-transport'

const transposters = new Map<Environment, nodemailer.Transporter>()

export const getTransporter = (env: Environment) => {
  if (transposters.has(env)) {
    return transposters.get(env)!
  }

  const config = EMAIL_CLIENT_CONFIGS[env]
  const transporter = nodemailer.createTransport({
    host: config.mailHost,
    port: config.mailPort,
    auth: {
      user: config.mailUser,
      pass: config.mailPassword,
    },
  } as SMTPTransport.Options)

  transposters.set(env, transporter)
  return transporter
}
