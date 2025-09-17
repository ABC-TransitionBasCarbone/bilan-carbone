import { getEnvVar } from '@/lib/environment'
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
  const basePath = path.join(process.cwd(), 'src', 'services', 'email', 'views')
  const customPath = path.join(basePath, env, `${file}.ejs`)
  const fallbackPath = path.join(basePath, 'common', `${file}.ejs`)
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
  const faq = getEnvVar('FAQ_LINK', env)
  const support = getEnvVar('SUPPORT_EMAIL', env)
  const from = getEnvVar('MAIL_USER', env)

  const data = {
    ...templateData,
    faq,
    support,
  }

  const transporter = getTransporter(env)
  const html = await getHtml({ file: template, data, env })
  return transporter.sendMail({
    to: to.join(','),
    from,
    subject,
    html,
    text: html.replace(/<(?:.|\n)*?>/gm, ''),
    headers: {
      'X-Mailjet-TrackOpen': '0',
      'X-Mailjet-TrackClick': '0',
    },
  })
}
