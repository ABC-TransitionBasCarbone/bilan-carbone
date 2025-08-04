import { EnvironmentNames } from '@/constants/environments'
import { sharedEmailEnv } from '@/lib/environment'
import { Environment } from '@prisma/client'
import { getTranslations } from 'next-intl/server'
import { sendEmail } from './send'
import { getEnvResetLink } from './utils'

const tSubject = async (keys: string, object?: Record<string, string | number | Date>) =>
  (await getTranslations('email.subject'))(keys, object)

export const sendResetPassword = async (toEmail: string, token: string, env: Environment) => {
  return sendEmail(env, [toEmail], await tSubject('resetPassword'), 'reset-password', {
    link: getEnvResetLink('reset-password', token, env),
  })
}

export const sendNewUserEmail = async (
  toEmail: string,
  token: string,
  creatorName: string,
  userName: string,
  env: Environment,
) => {
  return sendEmail(env, [toEmail], await tSubject('newUser'), 'new-user', {
    link: getEnvResetLink('reset-password', token, env),
    support: sharedEmailEnv.MAIL_USER,
    userName,
    creatorName,
  })
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
  return sendEmail(newEnv, [toEmail], await tSubject('addedActiveUser'), 'added-active-user', {
    link: `${sharedEmailEnv.NEXTAUTH_URL}/login`,
    support: sharedEmailEnv.MAIL_USER,
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
}

export const sendActivationEmail = async (toEmail: string, token: string, fromReset: boolean, env: Environment) => {
  return sendEmail(
    env,
    [toEmail],
    await tSubject('activation'),
    fromReset ? 'activate-account-from-reset' : 'activate-account',
    {
      link: getEnvResetLink('reset-password', token, env),
      support: sharedEmailEnv.MAIL_USER,
    },
  )
}

export const sendActivationRequest = async (
  toEmailList: string[],
  emailToActivate: string,
  userToActivate: string,
  env: Environment = Environment.BC,
) => {
  return sendEmail(env, toEmailList, await tSubject('activationRequest'), 'activation-request', {
    support: sharedEmailEnv.MAIL_USER,
    emailToActivate,
    userToActivate,
  })
}

export const sendUserOnStudyInvitationEmail = async (
  toEmail: string,
  studyName: string,
  studyId: string,
  organizationName: string,
  creatorName: string,
  userName: string,
  roleOnStudy: string,
  env: Environment,
) => {
  return sendEmail(env, [toEmail], await tSubject('userOnStudyInvitation', { studyName }), 'user-on-study-invitation', {
    link: sharedEmailEnv.NEXTAUTH_URL,
    userName,
    studyName,
    studyId,
    studyLink: `${sharedEmailEnv.NEXTAUTH_URL}/etudes/${studyId}`,
    organizationName,
    creatorName,
    role: roleOnStudy,
  })
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
  return sendEmail(
    env,
    [toEmail],
    await tSubject('userOnStudyInvitation', { studyName }),
    'new-user-on-study-invitation',
    {
      link: getEnvResetLink('reset-password', token, env),
      studyName,
      studyId,
      studyLink: `${sharedEmailEnv.NEXTAUTH_URL}/etudes/${studyId}`,
      organizationName,
      creatorName,
      support: sharedEmailEnv.MAIL_USER,
      role: roleOnStudy,
    },
  )
}

export const sendContributorInvitationEmail = async (
  toEmail: string,
  studyName: string,
  studyId: string,
  organizationName: string,
  creatorName: string,
  userName: string,
  env: Environment,
) => {
  return sendEmail(env, [toEmail], await tSubject('contributorInvitation', { studyName }), 'contributor-invitation', {
    link: sharedEmailEnv.NEXTAUTH_URL,
    userName,
    studyName,
    studyId,
    studyLink: `${sharedEmailEnv.NEXTAUTH_URL}/etudes/${studyId}`,
    organizationName,
    creatorName,
  })
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
  return sendEmail(
    env,
    [toEmail],
    await tSubject('contributorInvitation', { studyName }),
    'new-contributor-invitation',
    {
      link: getEnvResetLink('reset-password', token, env),
      studyName,
      studyId,
      studyLink: `${sharedEmailEnv.NEXTAUTH_URL}/etudes/${studyId}`,
      organizationName,
      creatorName,
      support: sharedEmailEnv.MAIL_USER,
    },
  )
}

export const sendAddedUsersByFile = async (results: Record<string, string>[], env: Environment) => {
  return sendEmail(env, [sharedEmailEnv.MAIL_USER], await tSubject('addedUsersByFile'), 'authorization-import-users', {
    results,
  })
}
