import { EnvironmentNames } from '@/constants/environments'
import { Environment } from '@prisma/client'
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
    from: process.env.MAIL_USER,
    subject,
    html,
    text: html.replace(/<(?:.|\n)*?>/gm, ''),
    headers: { 'X-Mailjet-TrackOpen': '0', 'X-Mailjet-TrackClick': '0' },
  }

  return mailTransport.sendMail(mail)
}

export const sendResetPassword = async (toEmail: string, token: string, env: Environment) => {
  const html = await getHtml('reset-password', {
    link: `${process.env.NEXTAUTH_URL}/reset-password/${token}?env=${env}`,
  })
  return send([toEmail], 'Mot de passe oublié', html)
}

export const sendNewUserEmail = async (
  toEmail: string,
  token: string,
  creatorName: string,
  userName: string,
  env: Environment,
) => {
  const html = await getHtml('new-user', {
    link: `${process.env.NEXTAUTH_URL}/reset-password/${token}?env=${env}`,
    support: process.env.MAIL_USER,
    userName,
    creatorName,
  })
  return send([toEmail], 'Vous avez été invité au BC+', html)
}

const getEnvInfo = (env: Environment) => {
  switch (env) {
    case Environment.BC:
      return "sur lequel vous pourrez donc réaliser ou participer à la réalisation d'un ou plusieurs Bilan Carbone®."
    case Environment.CUT:
      return "sur lequel vous pourrez réaliser l'empreinte carbone simplifiée de votre cinéma."
    default:
      return '.'
  }
}

export const sendAddedActiveUserEmail = async (
  toEmail: string,
  creatorName: string,
  userName: string,
  newEnv: Environment,
  oldEnvs: Environment[],
  orga: string,
) => {
  const html = await getHtml('added-active-user', {
    link: `${process.env.NEXTAUTH_URL}/login`,
    support: process.env.MAIL_USER,
    userName,
    creatorName,
    newEnv: EnvironmentNames[newEnv],
    oldEnvs:
      oldEnvs.length > 1
        ? `aux environnements ${oldEnvs.map((env) => EnvironmentNames[env]).join(', ')}`
        : `à l'environnement ${EnvironmentNames[oldEnvs[0]]}`,
    envInfo: getEnvInfo(newEnv),
    orga,
  })
  return send([toEmail], 'Vous avez été invité sur un nouvel environnement du BC+', html)
}

export const sendActivationEmail = async (toEmail: string, token: string, fromReset: boolean, env: Environment) => {
  let html
  if (fromReset) {
    html = await getHtml('activate-account-from-reset', {
      link: `${process.env.NEXTAUTH_URL}/reset-password/${token}?env=${env}`,
      support: process.env.MAIL_USER,
    })
  } else {
    html = await getHtml('activate-account', {
      link: `${process.env.NEXTAUTH_URL}/reset-password/${token}?env=${env}`,
      support: process.env.MAIL_USER,
    })
  }
  return send([toEmail], 'Vous avez activé votre compte sur le BC+', html)
}

export const sendActivationRequest = async (
  toEmailList: string[],
  emailToActivate: string,
  userToActivate: string,
  env: Environment = Environment.BC,
) => {
  const html = await getHtml(`activation-request-${env.toLowerCase()}`, {
    support: process.env.MAIL_USER,
    emailToActivate,
    userToActivate,
  })
  return send(toEmailList, `Demande d'accès à votre organisation ${env === Environment.BC ? 'BC+' : env}`, html)
}

export const sendUserOnStudyInvitationEmail = async (
  toEmail: string,
  studyName: string,
  studyId: string,
  organizationName: string,
  creatorName: string,
  userName: string,
  roleOnStudy: string,
) => {
  const html = await getHtml('user-on-study-invitation', {
    link: process.env.NEXTAUTH_URL,
    userName,
    studyName,
    studyId,
    studyLink: `${process.env.NEXTAUTH_URL}/etudes/${studyId}`,
    organizationName,
    creatorName,
    role: roleOnStudy,
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
  roleOnStudy: string,
  env: Environment,
) => {
  const html = await getHtml('new-user-on-study-invitation', {
    link: `${process.env.NEXTAUTH_URL}/reset-password/${token}?env=${env}`,
    studyName,
    studyId,
    studyLink: `${process.env.NEXTAUTH_URL}/etudes/${studyId}`,
    organizationName,
    creatorName,
    support: process.env.MAIL_USER,
    role: roleOnStudy,
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
  env: Environment,
) => {
  const html = await getHtml('new-contributor-invitation', {
    link: `${process.env.NEXTAUTH_URL}/reset-password/${token}?env=${env}`,
    studyName,
    studyId,
    studyLink: `${process.env.NEXTAUTH_URL}/etudes/${studyId}`,
    organizationName,
    creatorName,
    support: process.env.MAIL_USER,
  })
  return send([toEmail], `Demande de contribution sur l'étude ${studyName}`, html)
}

export const sendAddedUsersByFile = async (results: Record<string, string>[]) => {
  if (!process.env.MAIL_USER) {
    throw new Error("La variable d'environnement MAIL_USER n'est pas définie")
  }
  const html = await getHtml('authorization-import-users', { results })
  return send([process.env.MAIL_USER], `Autorisation pour l'ajout d'utilisateurs`, html)
}

export const sendNewCutUserActivationEmail = async (toEmail: string, token: string, siretOrCNC: string) => {
  const html = await getHtml('new-user-cut-activation', {
    link: `${process.env.NEXTAUTH_URL}/reset-password/${token}`,
    support: process.env.MAIL_USER,
  })
  return send([toEmail], `Vous avez créé un compte CUT - ${siretOrCNC}`, html)
}
