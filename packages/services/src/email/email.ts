import { Environment } from '@abc-transitionbascarbone/db-common/enums'
import { getEnvVar } from '@abc-transitionbascarbone/lib/environment'
import { EnvironmentNames } from '@abc-transitionbascarbone/utils/environments'
import { getTranslations } from 'next-intl/server'
import { sendEmail } from './send'
import { getEnvResetLink } from './utils'

const BASE_URL = process.env.NEXTAUTH_URL

const tSubject = async (keys: string, object?: Record<string, string | number | Date>) =>
  (await getTranslations('email.subject'))(keys, object)

const tBody = async (keys: string, object?: Record<string, string | number | Date>) =>
  (await getTranslations('email.body'))(keys, object)

export const sendResetPassword = async (toEmail: string, token: string, env: Environment = Environment.BC) => {
  return sendEmail(env, [toEmail], await tSubject('resetPassword'), 'reset-password', {
    link: getEnvResetLink('reset-password', token, env),
    t_resetContent: await tBody('resetPassword.content'),
    t_resetNotYou: await tBody('resetPassword.notYou'),
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
    userName,
    creatorName,
    t_helloName: await tBody('helloName', { name: userName }),
    t_added: await tBody('newUser.added', { creatorName }),
    t_access: await tBody('newUser.access'),
  })
}

const getEnvInfo = async (env: Environment) => {
  switch (env) {
    case Environment.BC:
      return tBody('addedActiveUser.envInfoBC')
    case Environment.CUT:
      return tBody('addedActiveUser.envInfoCUT')
    default:
      return tBody('addedActiveUser.envInfoDefault')
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
  const envInfo = await getEnvInfo(newEnv)
  const oldEnvsText =
    oldEnvs.length > 1
      ? await tBody('addedActiveUser.oldEnvsMultiple', { envNames: oldEnvs.map((env) => EnvironmentNames[env]).join(', ') })
      : await tBody('addedActiveUser.oldEnvsSingle', { envName: EnvironmentNames[oldEnvs[0]] })
  return sendEmail(newEnv, [toEmail], await tSubject('addedActiveUser'), 'added-active-user', {
    link: `${BASE_URL}/login`,
    userName,
    creatorName,
    newEnv: EnvironmentNames[newEnv],
    oldEnvs: oldEnvsText,
    envInfo,
    orga,
    t_helloName: await tBody('helloName', { name: userName }),
    t_added: await tBody('addedActiveUser.added', { creatorName, orga, newEnv: EnvironmentNames[newEnv], envInfo }),
    t_alreadyHadAccess: await tBody('addedActiveUser.alreadyHadAccess', { oldEnvs: oldEnvsText }),
    t_loginInfo: await tBody('addedActiveUser.loginInfo'),
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
      t_activateContent: await tBody(fromReset ? 'activateAccountFromReset.content' : 'activateAccount.content'),
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
    emailToActivate,
    userToActivate,
    t_content: await tBody('activationRequest.content', { userToActivate, emailToActivate }),
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
    link: BASE_URL,
    userName,
    studyName,
    studyId,
    studyLink: `${BASE_URL}/etudes/${studyId}`,
    organizationName,
    creatorName,
    role: roleOnStudy,
    t_helloName: await tBody('helloName', { name: userName }),
    t_added: await tBody('userOnStudyInvitation.added', { creatorName, role: roleOnStudy, studyName, organizationName }),
    t_access: await tBody('userOnStudyInvitation.access'),
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
      studyLink: `${BASE_URL}/etudes/${studyId}`,
      organizationName,
      creatorName,
      role: roleOnStudy,
      t_welcome: await tBody('newUserOnStudyInvitation.welcome'),
      t_added: await tBody('newUserOnStudyInvitation.added', { creatorName, role: roleOnStudy, studyName, organizationName }),
      t_access: await tBody('newUserOnStudyInvitation.access'),
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
    link: BASE_URL,
    userName,
    studyName,
    studyId,
    studyLink: `${BASE_URL}/etudes/${studyId}`,
    organizationName,
    creatorName,
    t_helloName: await tBody('helloName', { name: userName }),
    t_added: await tBody('contributorInvitation.added', { creatorName, studyName, organizationName }),
    t_access: await tBody('contributorInvitation.access'),
    t_accessContributionSpace: await tBody('contributorInvitation.accessContributionSpace'),
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
      studyLink: `${BASE_URL}/etudes/${studyId}`,
      organizationName,
      creatorName,
      t_welcome: await tBody('newContributorInvitation.welcome'),
      t_added: await tBody('newContributorInvitation.added', { creatorName, studyName, organizationName }),
      t_access: await tBody('newContributorInvitation.access'),
      t_accessPost: await tBody('newContributorInvitation.accessPost'),
    },
  )
}

export const sendAddedUsersByFile = async (results: Record<string, string>[], env: Environment) => {
  const support = await getEnvVar('SUPPORT_EMAIL', env)
  return sendEmail(env, [support], await tSubject('addedUsersByFile'), 'authorization-import-users', {
    results,
  })
}

export const sendCampaignCreatedByCollaboratorEmail = async (
  toEmails: string[],
  creatorName: string,
  campaignNames: string[],
  organizationName: string,
) => {
  const distinctCampaignNames = Array.from(new Set(campaignNames.map((name) => name.trim()).filter(Boolean)))

  if (distinctCampaignNames.length === 0) {
    return null
  }

  return sendEmail(
    Environment.MIP,
    toEmails,
    'Nouvelle campagne lancée sur Mon Impact Pro',
    'campaign-created-by-collaborator',
    {
      link: `${BASE_URL}/campaigns`,
      creatorName,
      campaignNames: distinctCampaignNames,
      campaignCount: distinctCampaignNames.length,
      organizationName,
    },
  )
}
