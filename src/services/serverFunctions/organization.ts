'use server'

import { getAccountOrganizationVersions } from '@/db/account'
import { prismaClient } from '@/db/client'
import { getEmissionFactorWithoutQuality } from '@/db/emissionFactors'
import {
  createOrganizationWithVersion,
  deleteClient,
  getOrganizationNameByOrganizationVersionId,
  getOrganizationVersionAccounts,
  getOrganizationVersionById,
  getRawOrganizationVersionById,
  onboardOrganizationVersion,
  setOnboarded,
  updateOrganization,
  updateOrganizationSites,
} from '@/db/organization'
import { deleteStudyMemberFromOrganization, getAllowedStudiesByAccountIdAndOrganizationId } from '@/db/study'
import { getUserApplicationSettings, getUserByEmail, updateAccount } from '@/db/user'
import { getLocale } from '@/i18n/locale'
import { uniqueByKey } from '@/utils/array'
import { CA_UNIT_VALUES, defaultCAUnit } from '@/utils/number'
import { withServerResponse } from '@/utils/serverResponse'
import { isAdmin } from '@/utils/user'
import { Account, Prisma, StudyRole, User, UserChecklist } from '@prisma/client'
import { auth, dbActualizedAuth } from '../auth'
import { NOT_AUTHORIZED, UNKNOWN_ERROR } from '../permissions/check'
import { hasAccessToCreateOrganization } from '../permissions/environment'
import {
  canCreateOrganization,
  canDeleteMember,
  canDeleteOrganizationVersion,
  canUpdateOrganizationVersion,
} from '../permissions/organization'
import { CreateOrganizationCommand, UpdateOrganizationCommand } from './organization.command'
import { getStudy } from './study'
import { DeleteCommand, SitesCommand } from './study.command'
import { addMember, addUserChecklistItem } from './user'
import { AddMemberCommand, OnboardingCommand } from './user.command'

/**
 *
 * @param studyId the id of the study whose organization is being fetched
 * @returns the id and name of the organization if found, null otherwise
 * The security and authorization checks are made in the getStudy function
 * Chloé, if you consider refactoring this function, do not forget to add the security and authorization checks
 */
export const getStudyOrganizationVersion = async (studyId: string) =>
  withServerResponse('getStudyOrganizationVersion', async () => {
    const study = await getStudy(studyId)
    if (!study.success || !study.data) {
      return null
    }
    return getOrganizationNameByOrganizationVersionId(study.data.organizationVersionId)
  })

export const createOrganizationCommand = async (command: CreateOrganizationCommand) =>
  withServerResponse('createOrganizationCommand', async () => {
    const session = await dbActualizedAuth()
    if (!session || !session.user.organizationVersionId || !hasAccessToCreateOrganization(session.user.environment)) {
      throw new Error(NOT_AUTHORIZED)
    }

    const organization = {
      ...command,
    } satisfies Prisma.OrganizationCreateInput

    const organizationVersion = {
      environment: session.user.environment,
      parent: { connect: { id: session.user.organizationVersionId } },
    } satisfies Omit<Prisma.OrganizationVersionCreateInput, 'organization'>

    if (!(await canCreateOrganization(session.user))) {
      throw new Error(NOT_AUTHORIZED)
    }

    try {
      const createdOrganizationVersion = await createOrganizationWithVersion(organization, organizationVersion)
      addUserChecklistItem(UserChecklist.AddClient)
      return { id: createdOrganizationVersion.id }
    } catch (e) {
      console.error(e)
      throw new Error(UNKNOWN_ERROR)
    }
  })

export const updateOrganizationCommand = async (command: UpdateOrganizationCommand) =>
  withServerResponse('updateOrganizationCommand', async () => {
    const session = await auth()
    if (!session || !session.user.organizationVersionId) {
      throw new Error(NOT_AUTHORIZED)
    }

    if (!(await canUpdateOrganizationVersion(session.user, command.organizationVersionId))) {
      throw new Error(NOT_AUTHORIZED)
    }

    const userCAUnit = (await getUserApplicationSettings(session.user.accountId))?.caUnit
    const caUnit = CA_UNIT_VALUES[userCAUnit || defaultCAUnit]

    await updateOrganization(command, caUnit)
    const organizationVersion = await getOrganizationVersionById(command.organizationVersionId)
    addUserChecklistItem(organizationVersion?.isCR ? UserChecklist.AddSiteCR : UserChecklist.AddSiteOrga)
  })

export const updateOrganizationSitesCommand = async (command: SitesCommand, organizationVersionId: string) =>
  withServerResponse('updateOrganizationSitesCommand', async () => {
    const session = await auth()
    if (!session || !session.user.organizationVersionId) {
      throw new Error(NOT_AUTHORIZED)
    }

    if (!(await canUpdateOrganizationVersion(session.user, organizationVersionId))) {
      throw new Error(NOT_AUTHORIZED)
    }

    const userCAUnit = (await getUserApplicationSettings(session.user.accountId))?.caUnit
    const caUnit = CA_UNIT_VALUES[userCAUnit || defaultCAUnit]

    await updateOrganizationSites(command, organizationVersionId, caUnit)
  })

export const deleteOrganizationCommand = async ({ id, name }: DeleteCommand) =>
  withServerResponse('deleteOrganizationCommand', async () => {
    if (!(await canDeleteOrganizationVersion(id))) {
      throw new Error(NOT_AUTHORIZED)
    }
    const organizationVersion = await getOrganizationNameByOrganizationVersionId(id)
    if (!organizationVersion) {
      throw new Error(NOT_AUTHORIZED)
    }

    if (organizationVersion.organization.name.toLowerCase() !== name.toLowerCase()) {
      throw new Error('wrongName')
    }

    return deleteClient(id)
  })

export const setOnboardedOrganizationVersion = async (organizationVersionId: string) =>
  withServerResponse('setOnboardedOrganizationVersion', async () => {
    const session = await dbActualizedAuth()
    const userOrganizationVersionId = session?.user.organizationVersionId

    if (!session || !userOrganizationVersionId || userOrganizationVersionId !== organizationVersionId) {
      throw new Error(NOT_AUTHORIZED)
    }

    await setOnboarded(organizationVersionId, session.user.accountId)
  })

const onboardUser = async (user: AddMemberCommand) => {
  try {
    await addMember(user)
  } catch (e) {
    console.error('Error during user onboarding, but still continue onboarding and adding other users:', e)
  }
}

export const onboardOrganizationVersionCommand = async (command: OnboardingCommand) =>
  withServerResponse('onboardOrganizationVersionCommand', async () => {
    const session = await dbActualizedAuth()
    const organizationVersionId = session?.user.organizationVersionId

    if (!session || !organizationVersionId || organizationVersionId !== command.organizationVersionId) {
      throw new Error(NOT_AUTHORIZED)
    }

    const organizationVersion = await getRawOrganizationVersionById(command.organizationVersionId)

    if (!organizationVersion || organizationVersion.id !== session.user.organizationVersionId) {
      throw new Error(NOT_AUTHORIZED)
    }

    await prismaClient.$transaction(async (transaction) => {
      await onboardOrganizationVersion(session.user.accountId, command, transaction)

      let collaborators: AddMemberCommand[] = []
      if (command.collaborators && command.collaborators?.length > 0) {
        const fileredCollaborators = uniqueByKey(command.collaborators, 'email').filter(
          (collaborator) => !!collaborator.email && !!collaborator.role,
        ) as { email: User['email']; role: Account['role'] }[]

        collaborators = fileredCollaborators.map((collaborator) => ({
          ...collaborator,
          firstName: '',
          lastName: '',
        }))

        await Promise.all(collaborators.map(onboardUser))
      }
    })
  })

export const deleteOrganizationMember = async (email: string) =>
  withServerResponse('deleteOrganizationMember', async () => {
    const session = await dbActualizedAuth()
    if (!session || !(await canDeleteMember(email))) {
      throw new Error(NOT_AUTHORIZED)
    }

    const targetMember = await getUserByEmail(email)

    const targetMemberAccount = targetMember?.accounts.find(
      (account) => account.organizationVersionId === session.user.organizationVersionId,
    )

    if (!targetMemberAccount || !targetMemberAccount.organizationVersionId) {
      throw new Error(NOT_AUTHORIZED)
    }
    const organizationVersions = await getAccountOrganizationVersions(targetMemberAccount.id)

    const blockingStudies = await getStudiesWithOnlyValidator(email, targetMemberAccount, organizationVersions)
    if (blockingStudies.length) {
      return {
        code: 'necessaryAdmin',
        studies: blockingStudies,
      }
    }

    await deleteStudyMemberFromOrganization(
      targetMemberAccount.id,
      organizationVersions.map((organizationVersion) => organizationVersion.id),
    )
    await updateAccount(targetMemberAccount.id, { organizationVersion: { disconnect: true } }, {})
    return null
  })

export const hasQualitylessEmissionFactors = async () =>
  withServerResponse('hasQualitylessEmissionFactors', async () => {
    const [session, locale] = await Promise.all([dbActualizedAuth(), getLocale()])
    if (!session || !session.user || !session.user.organizationId) {
      return []
    }

    const emissionFactors = await getEmissionFactorWithoutQuality(session.user.organizationId)
    return emissionFactors
      .map(
        (emissionFactor) =>
          emissionFactor.metaData.find((metadata) => metadata.language === locale) || emissionFactor.metaData[0],
      )
      .map((emissionFactor) => emissionFactor.title)
      .filter((emissionFactor) => emissionFactor !== null)
  })

const getStudiesWithOnlyValidator = async (
  email: string,
  account: Account,
  organizationVersions: Awaited<ReturnType<typeof getAccountOrganizationVersions>>,
) => {
  if (account && isAdmin(account.role)) {
    const organizationAccounts = await getOrganizationVersionAccounts(account.organizationVersionId)
    const organizationAdmins = organizationAccounts.filter(
      (account) => isAdmin(account.role) && account.user.email !== email,
    )
    // errors occurs only if no other ADMIN exists in the organization
    if (!organizationAdmins.length) {
      const organizationStudies = await getAllowedStudiesByAccountIdAndOrganizationId(
        organizationVersions.map((organizationVersion) => organizationVersion.id),
      )

      if (organizationStudies.length) {
        const organizationStudiesWithOnlyValidator = organizationStudies.filter((study) => {
          const validators = study.allowedUsers.filter((member) => member.role === StudyRole.Validator)
          return !validators.length || (validators.length === 1 && validators[0].accountId === account.id)
        })

        if (organizationStudiesWithOnlyValidator.length) {
          return organizationStudiesWithOnlyValidator
        }
      }
    }
  }
  return []
}

export const getUpdateOrganizationVersionPermission = async (organizationVersionId: string) =>
  withServerResponse('getUpdateOrganizationVersionPermission', async () => {
    const session = await dbActualizedAuth()

    if (!session) {
      return false
    }

    return canUpdateOrganizationVersion(session.user, organizationVersionId)
  })
