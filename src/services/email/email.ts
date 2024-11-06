import ejs, { Data } from 'ejs'
import nodemailer from 'nodemailer'
import SMTPTransport from 'nodemailer/lib/smtp-transport'

const mailTransport = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASSWORD,
  },
} as SMTPTransport.Options)

const getHtml = (file: string, data?: Data) => ejs.renderFile(`./src/services/email/views/${file}.ejs`, data)

const send = (toEmail: string[], subject: string, html: string) => {
  const mail = {
    to: toEmail.join(','),
    from: process.env.NEXT_PUBLIC_ABC_SUPPORT_MAIL,
    subject,
    html,
    text: html.replace(/<(?:.|\n)*?>/gm, ''),
    headers: { 'X-Mailjet-TrackOpen': '0', 'X-Mailjet-TrackClick': '0' },
  }

  return mailTransport.sendMail(mail)
}

export const sendResetPassword = async (toEmail: string, token: string) => {
  const html = await getHtml('reset-password', { link: `${process.env.NEXTAUTH_URL}/reset-password/${token}` })
  return send([toEmail], 'Mot de passe oublié', html)
}

export const sendNewInvitation = async (toEmail: string, token: string) => {
  const html = await getHtml('new-invitation', { link: `${process.env.NEXTAUTH_URL}/reset-password/${token}` })
  return send([toEmail], 'Vous avez été invité au BC+', html)
}
