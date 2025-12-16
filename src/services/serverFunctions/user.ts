'use server'

import { environmentsWithChecklist } from '@/constants/environments'
import {
  AccountWithUser,
  addAccount,
  changeAccountRole,
  getAccountByEmailAndEnvironment,
  getAccountByEmailAndOrganizationVersionId,
  getAccountById,
  getAccountFromUserOrganization,
  getAccountsFromUser,
} from '@/db/account'
import { findCncByCncCode } from '@/db/cnc'
import { isFeatureActive } from '@/db/deactivableFeatures'
import {
  createOrganizationWithVersion,
  getOrganizationNameByOrganizationVersionId,
  getOrganizationVersionById,
  getOrganizationVersionByOrganizationIdAndEnvironment,
  getRawOrganizationBySiret,
  getRawOrganizationBySiteCNC,
  getRawOrganizationBySiteEstablishmentId,
  isOrganizationVersionCR,
} from '@/db/organization'
import { addSite } from '@/db/site'
import { FullStudy } from '@/db/study'
import {
  addUser,
  changeStatus,
  createOrUpdateUserCheckedStep,
  deleteUserFromOrga,
  finalizeUserChecklist,
  getUserApplicationSettings,
  getUserByEmail,
  getUserFeedbackDate,
  getUserFormationFormStart,
  getUsers,
  getUsersCheckedSteps,
  getUserSourceById,
  handleAddingUser,
  organizationVersionActiveAccountsCount,
  startUserFormationForm,
  updateAccount,
  updateUser,
  updateUserApplicationSettings,
  updateUserFeedbackDate,
  updateUserResetTokenForEmail,
  UserWithAccounts,
  validateUser,
} from '@/db/user'
import { processUsers } from '@/scripts/ftp/userImport'
import { withServerResponse } from '@/utils/serverResponse'
import { DAY, HOUR, MIN, TIME_IN_MS, YEAR } from '@/utils/time'
import { getRoleToSetForUntrained } from '@/utils/user'
import { accountWithUserToUserSession, userSessionToDbUser } from '@/utils/userAccounts'
import { DeactivatableFeature, Environment, Organization, Role, User, UserChecklist, UserStatus } from '@prisma/client'
import jwt from 'jsonwebtoken'
import { UserSession } from 'next-auth'
import { getCompanyName, getValidAssociationNameBySiret } from '../associationApi'
import { auth, dbActualizedAuth } from '../auth'
import { getUserCheckList } from '../checklist'
import {
  sendActivationEmail,
  sendActivationInvitationEmail,
  sendActivationRequest,
  sendAddedActiveUserEmail,
  sendAddedUsersByFile,
  sendContributorInvitationEmail,
  sendNewContributorInvitationEmail,
  sendNewUserEmail,
  sendNewUserOnStudyInvitationEmail,
  sendResetPassword,
  sendUserOnStudyInvitationEmail,
} from '../email/email'
import {
  EMAIL_SENT,
  MORE_THAN_ONE,
  NOT_ASSOCIATION_SIRET,
  NOT_AUTHORIZED,
  REQUEST_SENT,
  UNKNOWN_SCHOOL,
  UNKNOWN_SIRET_OR_CNC,
} from '../permissions/check'
import { canAddMember, canChangeRole, canDeleteMember, canEditSelfRole } from '../permissions/user'
import { School } from '../schoolApi'
import { getDeactivableFeatureRestrictions } from './deactivableFeatures'
import { AddMemberCommand, EditProfileCommand, EditSettingsCommand } from './user.command'

const updateUserResetToken = async (email: string, duration: number) => {
  const resetToken = Math.random().toString(36)
  const payload = {
    email,
    resetToken,
    exp: Math.round(Date.now() / TIME_IN_MS) + duration,
  }
  await updateUserResetTokenForEmail(email, resetToken)
  return jwt.sign(payload, process.env.NEXTAUTH_SECRET as string)
}

export const sendEmailToAddedUser = async (
  email: string,
  user: User,
  newUserName: string,
  env: Environment,
  orgaVersionId: string,
) =>
  withServerResponse('sendEmailToAddedUser', async () => {
    const addedMember = await getUserByEmail(email)
    const activeAccounts = addedMember?.accounts.filter((account) => account.status === UserStatus.ACTIVE)
    const orga = await getOrganizationNameByOrganizationVersionId(orgaVersionId)

    if (activeAccounts?.length && activeAccounts.length > 0) {
      return sendAddedActiveUserEmail(
        email,
        `${user.firstName} ${user.lastName}`,
        newUserName,
        env,
        activeAccounts.map((account) => account.environment),
        orga?.organization.name || '',
      )
    }

    const token = await updateUserResetToken(email, 1 * DAY)
    return sendNewUserEmail(email, token, `${user.firstName} ${user.lastName}`, newUserName, env)
  })

export const sendInvitation = async (
  email: string,
  study: FullStudy,
  organization: Organization,
  creator: UserSession,
  roleOnStudy: string,
  env: Environment,
  existingAccount?: AccountWithUser,
) =>
  withServerResponse('sendInvitation', async () => {
    if (existingAccount) {
      if (existingAccount.status === UserStatus.ACTIVE) {
        return roleOnStudy
          ? sendUserOnStudyInvitationEmail(
              email,
              study.name,
              study.id,
              organization.name,
              `${creator.firstName} ${creator.lastName}`,
              existingAccount.user.firstName,
              roleOnStudy,
              env,
            )
          : sendContributorInvitationEmail(
              email,
              study.name,
              study.id,
              organization.name,
              `${creator.firstName} ${creator.lastName}`,
              existingAccount.user.firstName,
              env,
            )
      } else if (existingAccount.status === UserStatus.IMPORTED) {
        return sendActivationInvitationEmail(
          email,
          `${creator.firstName} ${creator.lastName}`,
          existingAccount.user.firstName,
          !!roleOnStudy,
          study.name,
          env,
        )
      }
    }

    const token = await updateUserResetToken(email, 1 * DAY)

    return roleOnStudy
      ? sendNewUserOnStudyInvitationEmail(
          email,
          token,
          study.name,
          study.id,
          organization.name,
          `${creator.firstName} ${creator.lastName}`,
          roleOnStudy,
          env,
        )
      : sendNewContributorInvitationEmail(
          email,
          token,
          study.name,
          study.id,
          organization.name,
          `${creator.firstName} ${creator.lastName}`,
          env,
        )
  })

const sendActivation = async (email: string, fromReset: boolean, env: Environment) => {
  const token = await updateUserResetToken(email, 1 * HOUR)
  return sendActivationEmail(email, token, fromReset, env)
}

export const addMember = async (member: AddMemberCommand) =>
  withServerResponse('addMember', async () => {
    const session = await dbActualizedAuth()
    if (!session || !session.user || !session.user.organizationVersionId || member.role === Role.SUPER_ADMIN) {
      throw new Error(NOT_AUTHORIZED)
    }

    if (!canAddMember(session.user, member, session.user.organizationVersionId)) {
      throw new Error(NOT_AUTHORIZED)
    }

    await handleAddingUser(session.user, member)
  })

export const validateMember = async (email: string) =>
  withServerResponse('validateMember', async () => {
    const session = await dbActualizedAuth()
    if (!session || !session.user || !session.user.organizationVersionId) {
      throw new Error(NOT_AUTHORIZED)
    }

    const member = await getAccountByEmailAndOrganizationVersionId(email, session.user.organizationVersionId)
    if (!member || !canAddMember(session.user, member, member.organizationVersionId)) {
      throw new Error(NOT_AUTHORIZED)
    }

    await validateUser(member.id)

    await sendEmailToAddedUser(
      member.user.email.toLowerCase(),
      userSessionToDbUser(session.user),
      member.user.firstName,
      session.user.environment,
      session.user.organizationVersionId,
    )
  })

export const resendInvitation = async (email: string) =>
  withServerResponse('resendInvitation', async () => {
    const session = await dbActualizedAuth()
    if (!session || !session.user || !session.user.organizationVersionId) {
      throw new Error(NOT_AUTHORIZED)
    }

    const member = await getAccountByEmailAndOrganizationVersionId(email, session.user.organizationVersionId)
    if (!member || !canAddMember(session.user, member, member.organizationVersionId)) {
      throw new Error(NOT_AUTHORIZED)
    }

    await sendEmailToAddedUser(
      member.user.email,
      userSessionToDbUser(session.user),
      member.user.firstName,
      session.user.environment,
      session.user.organizationVersionId,
    )
  })

export const deleteMember = async (email: string) =>
  withServerResponse('deleteMember', async () => {
    const session = await dbActualizedAuth()
    if (!session || !session.user) {
      throw new Error(NOT_AUTHORIZED)
    }

    const accountToRemove = await getAccountByEmailAndOrganizationVersionId(email, session.user.organizationVersionId)
    if (!canDeleteMember(session.user, accountToRemove as AccountWithUser)) {
      throw new Error(NOT_AUTHORIZED)
    }
    await deleteUserFromOrga(email, session.user.organizationVersionId)
  })

export const changeRole = async (email: string, role: Role) =>
  withServerResponse('changeRole', async () => {
    const session = await dbActualizedAuth()
    if (!session || !session.user || !session.user.organizationVersionId) {
      throw new Error(NOT_AUTHORIZED)
    }

    const accountToChange = await getAccountByEmailAndOrganizationVersionId(email, session.user.organizationVersionId)

    if (!accountToChange) {
      throw new Error(NOT_AUTHORIZED)
    }

    if (!canChangeRole(session.user, accountToChange as AccountWithUser, role)) {
      throw new Error(NOT_AUTHORIZED)
    }

    const team = await getAccountFromUserOrganization(session.user)
    const selfEditRolesCount = team.filter((member) => canEditSelfRole(member.role)).length
    if (
      accountToChange &&
      selfEditRolesCount === 1 &&
      canEditSelfRole(accountToChange.role) &&
      !canEditSelfRole(role)
    ) {
      return MORE_THAN_ONE
    }

    const targetAccount = await getAccountById(accountToChange.id)
    if (!targetAccount || targetAccount.organizationVersionId !== session.user.organizationVersionId) {
      throw new Error(NOT_AUTHORIZED)
    }

    await changeAccountRole(accountToChange.id, role)
  })

export const updateUserProfile = async (command: EditProfileCommand) =>
  withServerResponse('updateUserProfile', async () => {
    const session = await auth()
    if (!session || !session.user) {
      throw new Error(NOT_AUTHORIZED)
    }

    await updateUser(session.user.userId, command)
  })

export const resetPassword = async (email: string, userEnv: Environment | undefined) =>
  withServerResponse('resetPassword', async () => {
    const env = userEnv || Environment.BC
    const user = await getUserByEmail(email)

    if (!user || user.accounts.every((a) => a.status !== UserStatus.ACTIVE)) {
      const activation = await activateEmail(email, env, true)
      if (activation.success) {
        return activation.data
      } else {
        throw new Error(activation.errorMessage)
      }
    } else {
      if (user) {
        const resetToken = Math.random().toString(36)
        const payload = {
          email,
          resetToken,
          exp: Math.round(Date.now() / TIME_IN_MS) + HOUR, // 1 hour expiration
        }

        const token = jwt.sign(payload, process.env.NEXTAUTH_SECRET as string)
        await updateUserResetTokenForEmail(email, resetToken)
        await sendResetPassword(email, token, env)
      }
    }
  })

export const activateEmail = async (email: string, userEnv: Environment | undefined, fromReset: boolean = false) =>
  withServerResponse('activateEmail', async () => {
    const env = userEnv || Environment.BC

    const user = await getUserByEmail(email.toLowerCase())
    const account = (await getAccountById(
      user?.accounts.find((a) => a.environment === env)?.id || '',
    )) as AccountWithUser

    if (!user || !account || !account.organizationVersionId || account.status === UserStatus.ACTIVE) {
      throw new Error(NOT_AUTHORIZED)
    }

    const accountOrgaVersion = await getOrganizationVersionById(account.organizationVersionId)
    if (!accountOrgaVersion || (!accountOrgaVersion.activatedLicence && env === Environment.BC)) {
      throw new Error(NOT_AUTHORIZED)
    }

    if (
      (await organizationVersionActiveAccountsCount(account.organizationVersionId)) &&
      account.status !== UserStatus.VALIDATED
    ) {
      const accounts = await getAccountFromUserOrganization(accountWithUserToUserSession(account))
      await sendActivationRequest(
        accounts
          .filter((a) => (a.role === Role.GESTIONNAIRE || a.role === Role.ADMIN) && a.status == UserStatus.ACTIVE)
          .map((a) => a.user.email),
        email.toLowerCase(),
        `${user.firstName} ${user.lastName}`,
      )

      await changeStatus(account.id, UserStatus.PENDING_REQUEST)

      return REQUEST_SENT
    } else {
      await validateUser(account.id)
      await sendActivation(email, fromReset, env)

      return EMAIL_SENT
    }
  })

export const getUserSettings = async () =>
  withServerResponse('getUserSettings', async () => {
    const session = await auth()
    if (!session || !session.user) {
      return null
    }
    return getUserApplicationSettings(session.user.accountId)
  })

export const getUserSource = async () =>
  withServerResponse('getUserSource', async () => {
    const session = await auth()
    if (!session || !session.user) {
      return null
    }

    return (await getUserSourceById(session.user.userId))?.source
  })

export const updateUserSettings = async (command: EditSettingsCommand) =>
  withServerResponse('updateUserSettings', async () => {
    const session = await auth()
    if (!session || !session.user) {
      throw new Error(NOT_AUTHORIZED)
    }
    await updateUserApplicationSettings(session.user.accountId, command)
  })

export const getUserCheckedItems = async () =>
  withServerResponse('getUserCheckedItems', async () => {
    const session = await auth()
    if (!session || !session.user) {
      return []
    }
    return getUsersCheckedSteps(session.user.accountId)
  })

export const addUserChecklistItem = async (step: UserChecklist) =>
  withServerResponse('addUserChecklistItem', async () => {
    const session = await dbActualizedAuth()
    if (!session || !session.user || !environmentsWithChecklist.includes(session.user.environment)) {
      return
    }

    const isCR = await isOrganizationVersionCR(session.user.organizationVersionId)
    const checklist = getUserCheckList(session.user.role, !!isCR, session.user.level)
    if (!Object.values(checklist).includes(step)) {
      return
    }

    await createOrUpdateUserCheckedStep(session.user.accountId, step)

    const userChecklist = await getUserCheckedItems()
    if (userChecklist.success && userChecklist.data.length === Object.values(checklist).length - 1) {
      setTimeout(
        async () => {
          await finalizeUserChecklist(session.user.accountId)
        },
        1 * MIN * TIME_IN_MS,
      )
    }
  })

export const sendAddedUsersAndProccess = async (results: Record<string, string>[], env: Environment) =>
  withServerResponse('sendAddedUsersAndProccess', async () => {
    sendAddedUsersByFile(results, env)
    processUsers(results, new Date())
  })

export const verifyPasswordAndProcessUsers = async (uuid: string) =>
  withServerResponse('verifyPasswordAndProcessUsers', async () => uuid === process.env.ADMIN_PASSWORD)

export const getFormationFormStart = async (userId: string) =>
  withServerResponse('getFormationFormStart', async () => getUserFormationFormStart(userId))

export const startFormationForm = async (userId: string, date: Date) =>
  withServerResponse('startFormationForm', async () => startUserFormationForm(userId, date))

export const changeUserRoleOnOnboarding = async () =>
  withServerResponse('changeUserRoleOnOnboarding', async () => {
    const session = await auth()
    if (!session || !session.user) {
      return
    }

    const newRole = session.user.level ? Role.ADMIN : getRoleToSetForUntrained(Role.ADMIN, session.user.environment)
    await changeAccountRole(session.user.accountId, newRole)
  })

export const lowercaseUsersEmails = async () => {
  const users = await getUsers()

  const duplicated = users.filter(
    (user) => users.filter((u) => u.email.toLowerCase() === user.email.toLowerCase()).length > 1,
  )
  if (duplicated.length > 1) {
    const emails = duplicated.map((user) => user.email)
    console.log(`Migration impossible, il existe ${emails.length} adresses mail dupliquées : `)
    emails.sort((a, b) => a.localeCompare(b)).forEach((email) => console.log(`- ${email}`))
    console.log('Veuillez régler ces conflicts en premier lieu')
  } else {
    const capitalizedUsers = users.filter((user) => user.email !== user.email.toLowerCase())
    await Promise.all(capitalizedUsers.map((user) => updateUser(user.id, { email: user.email.toLowerCase() })))
    console.log(`Fait : ${capitalizedUsers.length} utilisateurs mis à jour`)
  }
}

export const getUserActiveAccounts = async () =>
  withServerResponse('getUserActiveAccounts', async () => {
    const session = await dbActualizedAuth()
    if (!session || !session.user) {
      return []
    }
    const accounts = await getAccountsFromUser(session.user)
    return accounts.filter((account) => account.status === UserStatus.ACTIVE)
  })

export const displayFeedBackForm = async () =>
  withServerResponse('displayFeedBackForm', async () => {
    const session = await auth()
    if (!session || !session.user) {
      return false
    }

    const [userFeedbackDate, activeFeature] = await Promise.all([
      getUserFeedbackDate(session.user.accountId),
      isFeatureActive(DeactivatableFeature.Feedback),
    ])

    if (!userFeedbackDate || !activeFeature) {
      return false
    }
    if (!userFeedbackDate.feedbackDate || new Date() > new Date(userFeedbackDate.feedbackDate)) {
      return true
    }
    return false
  })

export const delayFeeback = async () =>
  withServerResponse('delayFeeback', async () => {
    const session = await auth()
    if (!session || !session.user) {
      throw new Error(NOT_AUTHORIZED)
    }
    const now = new Date()
    const feedbackDate = new Date(now.getTime() + Number(process.env.NEXT_PUBLIC_FEEDBACK_TYPEFORM_DELAY))
    updateUserFeedbackDate(session.user.accountId, feedbackDate)
  })

export const answerFeeback = async () =>
  withServerResponse('answerFeeback', async () => {
    const session = await auth()
    if (!session || !session.user) {
      throw new Error(NOT_AUTHORIZED)
    }
    const now = new Date()
    const feedbackDate = new Date(now.getTime() + 10 * YEAR * TIME_IN_MS)
    updateUserFeedbackDate(session.user.accountId, feedbackDate)
  })

export const signUpWithSiretOrCNC = async (email: string, siretOrCNC: string, environment: Environment) =>
  withServerResponse('signUpWithSiretOrCNC', async () => {
    const trimmedEmail = email.trim().toLowerCase()
    const deactivatedFeaturesRestrictions = await getDeactivableFeatureRestrictions(DeactivatableFeature.Creation)
    if (
      deactivatedFeaturesRestrictions?.active &&
      deactivatedFeaturesRestrictions.deactivatedEnvironments?.includes(environment)
    ) {
      throw new Error(NOT_AUTHORIZED)
    }

    const accountAlreadyCreated = await getAccountByEmailAndEnvironment(trimmedEmail, environment)
    if (accountAlreadyCreated && accountAlreadyCreated.organizationVersionId) {
      if (environment === Environment.TILT && accountAlreadyCreated.status !== UserStatus.ACTIVE) {
        const activation = await activateEmail(trimmedEmail, environment)
        if (!activation.success) {
          throw new Error(activation.errorMessage)
        }
        return activation.data
      }
      throw new Error(NOT_AUTHORIZED)
    }

    let user = (await getUserByEmail(trimmedEmail)) as UserWithAccounts
    let organization = null
    let account = null

    if (!user) {
      user = (await addUser({
        email: trimmedEmail,
        firstName: '',
        lastName: '',
        accounts: {
          create: {
            status: UserStatus.PENDING_REQUEST,
            role: Role.DEFAULT,
            environment,
          },
        },
      })) as UserWithAccounts
      account = user?.accounts[0]
    } else {
      account =
        accountAlreadyCreated ||
        ((await addAccount({
          user: { connect: { id: user.id } },
          role: Role.DEFAULT,
          environment,
          status: UserStatus.PENDING_REQUEST,
        })) as AccountWithUser)
    }
    if (!user || !account) {
      throw new Error(NOT_AUTHORIZED)
    }

    let organizationVersion = null

    if (environment === Environment.CUT) {
      const CNC = await findCncByCncCode(siretOrCNC)
      if (CNC) {
        organization = await getRawOrganizationBySiteCNC(siretOrCNC)
        organizationVersion = organization?.id
          ? await getOrganizationVersionByOrganizationIdAndEnvironment(organization.id, environment)
          : null

        if (!organizationVersion) {
          organizationVersion = await createOrganizationWithVersion(
            { name: CNC.nom || '' },
            { environment: environment },
          )

          await addSite({
            name: CNC.nom || '',
            postalCode: CNC.codeInsee || '',
            city: CNC.commune || '',
            cnc: {
              connectOrCreate: {
                create: {},
                where: {
                  id: CNC.id,
                },
              },
            },
            organization: { connect: { id: organizationVersion.organizationId } },
          })
        }
      }
    }

    if (!organizationVersion && siretOrCNC.length < 9) {
      // Too small to be a SIRET or even SIREN and not a CNC in our DB
      throw new Error(UNKNOWN_SIRET_OR_CNC)
    }

    if (!organizationVersion) {
      let companyName = ''

      if (environment === Environment.TILT) {
        const associationName = await getValidAssociationNameBySiret(siretOrCNC)
        if (!associationName) {
          throw new Error(NOT_ASSOCIATION_SIRET)
        }
        companyName = associationName
      }

      organization = await getRawOrganizationBySiret(siretOrCNC)

      if (environment === Environment.CUT && !organization?.id) {
        companyName = (await getCompanyName(siretOrCNC)) || ''

        if (companyName === '') {
          console.error('Company name not found for siretOrCNC:', siretOrCNC)
          throw new Error(UNKNOWN_SIRET_OR_CNC)
        }
      }

      organizationVersion = organization?.id
        ? await getOrganizationVersionByOrganizationIdAndEnvironment(organization.id, environment)
        : await createOrganizationWithVersion(
            { wordpressId: siretOrCNC, name: companyName },
            { environment: environment },
          )
    }

    if (!organizationVersion) {
      throw new Error(NOT_AUTHORIZED)
    }

    await updateAccount(account.id, {
      role: organization?.id ? Role.DEFAULT : Role.ADMIN,
      organizationVersion: { connect: { id: organizationVersion.id } },
    })

    if (organization?.id) {
      const createdAccount = (await getAccountById(account.id || '')) as AccountWithUser
      const accounts = await getAccountFromUserOrganization(accountWithUserToUserSession(createdAccount))

      await sendActivationRequest(
        accounts.filter((a) => a.role === Role.GESTIONNAIRE || a.role === Role.ADMIN).map((a) => a.user.email),
        trimmedEmail,
        `${user.firstName} ${user.lastName}`,
        environment,
      )

      return REQUEST_SENT
    } else {
      await validateUser(account.id)
      await sendActivation(trimmedEmail, false, environment)
    }
    return EMAIL_SENT
  })

export const signUpWithSchool = async (email: string, school: School, environment: Environment) =>
  withServerResponse('signUpWithSchool', async () => {
    const trimmedEmail = email.trim().toLowerCase()
    if (!school || !school.identifiant_de_l_etablissement) {
      throw new Error(UNKNOWN_SCHOOL)
    }
    const deactivatedFeaturesRestrictions = await getDeactivableFeatureRestrictions(DeactivatableFeature.Creation)
    if (
      deactivatedFeaturesRestrictions?.active &&
      deactivatedFeaturesRestrictions.deactivatedEnvironments?.includes(environment)
    ) {
      throw new Error(NOT_AUTHORIZED)
    }

    const accountAlreadyCreated = await getAccountByEmailAndEnvironment(trimmedEmail, environment)
    if (accountAlreadyCreated && accountAlreadyCreated.organizationVersionId) {
      throw new Error(NOT_AUTHORIZED)
    }

    let user = (await getUserByEmail(trimmedEmail)) as UserWithAccounts
    let organization = null
    let account = null

    if (!user) {
      user = (await addUser({
        email: trimmedEmail,
        firstName: '',
        lastName: '',
        accounts: {
          create: {
            status: UserStatus.PENDING_REQUEST,
            role: Role.DEFAULT,
            environment,
          },
        },
      })) as UserWithAccounts
      account = user?.accounts[0]
    } else {
      account =
        accountAlreadyCreated ||
        ((await addAccount({
          user: { connect: { id: user.id } },
          role: Role.DEFAULT,
          environment,
          status: UserStatus.PENDING_REQUEST,
        })) as AccountWithUser)
    }
    if (!user || !account) {
      throw new Error(NOT_AUTHORIZED)
    }

    let organizationVersion = null

    organization = await getRawOrganizationBySiteEstablishmentId(school.identifiant_de_l_etablissement)
    organizationVersion = organization?.id
      ? await getOrganizationVersionByOrganizationIdAndEnvironment(organization.id, environment)
      : null

    if (!organizationVersion) {
      organizationVersion = await createOrganizationWithVersion(
        { name: school.nom_etablissement || '' },
        { environment: environment },
      )

      await addSite({
        name: school.nom_etablissement || '',
        postalCode: school.code_postal || '',
        establishmentId: school.identifiant_de_l_etablissement,
        establishmentYear: school.date_ouverture || '',
        organization: { connect: { id: organizationVersion.organizationId } },
      })
    }

    if (!organizationVersion) {
      throw new Error(NOT_AUTHORIZED)
    }

    await updateAccount(account.id, {
      role: organization?.id ? Role.DEFAULT : Role.ADMIN,
      organizationVersion: { connect: { id: organizationVersion.id } },
    })

    if (organization?.id) {
      const createdAccount = (await getAccountById(account.id || '')) as AccountWithUser
      const accounts = await getAccountFromUserOrganization(accountWithUserToUserSession(createdAccount))

      await sendActivationRequest(
        accounts.filter((a) => a.role === Role.GESTIONNAIRE || a.role === Role.ADMIN).map((a) => a.user.email),
        trimmedEmail,
        `${user.firstName} ${user.lastName}`,
        environment,
      )

      return REQUEST_SENT
    } else {
      await validateUser(account.id)
      await sendActivation(trimmedEmail, false, environment)
    }
    return EMAIL_SENT
  })
