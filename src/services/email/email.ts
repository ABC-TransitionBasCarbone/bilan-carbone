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

export const sendNewUserEmail = async (toEmail: string, token: string, creatorName: string, userName: string) => {
  const html = await getHtml('new-user', {
    link: `${process.env.NEXTAUTH_URL}/reset-password/${token}`,
    support: process.env.NEXT_PUBLIC_ABC_SUPPORT_MAIL,
    userName,
    creatorName,
  })
  return send([toEmail], 'Vous avez été invité au BC+', html)
}

export const sendActivationEmail = async (toEmail: string, token: string) => {
  const html = await getHtml('activate-account', {
    link: `${process.env.NEXTAUTH_URL}/reset-password/${token}`,
    support: process.env.NEXT_PUBLIC_ABC_SUPPORT_MAIL,
  })
  return send([toEmail], 'Vous avez activé votre compte sur le BC+', html)
}

export const sendUserOnStudyInvitationEmail = async (
  toEmail: string,
  studyName: string,
  studyId: string,
  organizationName: string,
  creatorName: string,
  userName: string,
  role: string,
) => {
  const html = await getHtml('user-on-study-invitation', {
    link: process.env.NEXTAUTH_URL,
    userName,
    studyName,
    studyId,
    studyLink: `${process.env.NEXTAUTH_URL}/etudes/${studyId}`,
    organizationName,
    creatorName,
    role,
  })
  return send([toEmail], `Ajout sur l'étude ${studyName}`, html)
}
export const sendNewUserOnStudyInvitationEmail = async (
  toEmail: string,
  token: string,
  studyName: string,
  studyId: string,
  organizationName: string,
  creatorName: string,
  role: string,
) => {
  const html = await getHtml('new-user-on-study-invitation', {
    link: `${process.env.NEXTAUTH_URL}/reset-password/${token}`,
    studyName,
    studyId,
    studyLink: `${process.env.NEXTAUTH_URL}/etudes/${studyId}`,
    organizationName,
    creatorName,
    support: process.env.NEXT_PUBLIC_ABC_SUPPORT_MAIL,
    role,
  })
  return send([toEmail], `Ajout sur l'étude ${studyName}`, html)
}

export const sendContributorInvitationEmail = async (
  toEmail: string,
  studyName: string,
  studyId: string,
  organizationName: string,
  creatorName: string,
  userName: string,
) => {
  const html = await getHtml('contributor-invitation', {
    link: process.env.NEXTAUTH_URL,
    userName,
    studyName,
    studyId,
    studyLink: `${process.env.NEXTAUTH_URL}/etudes/${studyId}`,
    organizationName,
    creatorName,
  })
  return send([toEmail], `Demande de contribution sur l'étude ${studyName}`, html)
}

export const sendNewContributorInvitationEmail = async (
  toEmail: string,
  token: string,
  studyName: string,
  studyId: string,
  organizationName: string,
  creatorName: string,
) => {
  const html = await getHtml('new-contributor-invitation', {
    link: `${process.env.NEXTAUTH_URL}/reset-password/${token}`,
    studyName,
    studyId,
    studyLink: `${process.env.NEXTAUTH_URL}/etudes/${studyId}`,
    organizationName,
    creatorName,
    support: process.env.NEXT_PUBLIC_ABC_SUPPORT_MAIL,
  })
  return send([toEmail], `Demande de contribution sur l'étude ${studyName}`, html)
}
