import { EMAIL_CLIENT_CONFIGS } from '@/types/email'
import { Environment } from '@prisma/client'
import ejs from 'ejs'
import fs from 'fs'
import path from 'path'
import { getTransporter } from './transposter'

/**
 * Renders EJS email template to an HTML string,
 * This method load template by environment folder (BC/, CUT/, …), if not find env folder search in common/
 *
 * @param params.file - Template filename without extension `.ejs`.
 * @param params.env - Environment name used to locate template folder.
 * @param params.data - Optional data object to inject EJS template.
 * @returns Prosmise that resolves rendered HTML string.
 */
const getHtml = async ({ file, env, data }: { file: string; env: Environment; data?: ejs.Data }) => {
  const customPath = path.join(__dirname, 'views', env, `${file}.ejs`)
  const fallbackPath = path.join(__dirname, 'views', 'common', `${file}.ejs`)
  const templatePath = fs.existsSync(customPath) ? customPath : fallbackPath

  return ejs.renderFile(templatePath, data)
}

/**
 * Sends email using environment configuration.
 *
 * @param env - To determine email configuration.
 * @param to - List of recipient addresses.
 * @param subject - Subject line of the email.
 * @param template - Name of email template to render (without extension).
 * @param templateData - Data to inject in EJS template.
 * @returns Promise that resolves when the email is sent.
 */
export const sendEmail = async (
  env: Environment,
  to: string[],
  subject: string,
  template: string,
  templateData: Record<string, unknown>,
) => {
  const config = EMAIL_CLIENT_CONFIGS[env]
  const transporter = getTransporter(env)
  const html = await getHtml({ file: template, data: templateData, env })

  return transporter.sendMail({
    to: to.join(','),
    from: config.mailUser,
    subject,
    html,
    text: html.replace(/<(?:.|\n)*?>/gm, ''),
    headers: {
      'X-Mailjet-TrackOpen': '0',
      'X-Mailjet-TrackClick': '0',
    },
  })
}
