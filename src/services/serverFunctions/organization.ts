'use server'

import { AccountWithUser, getAccountById } from '@/db/account'
import {
  createOrganization,
  deleteClient,
  getOrganizationById,
  getOrganizationNameById,
  onboardOrganization,
  setOnboarded,
  updateOrganization,
} from '@/db/organization'
import { getRawOrganizationById } from '@/db/organizationImport'
import { getUserApplicationSettings } from '@/db/user'
import { uniqBy } from '@/utils/array'
import { CA_UNIT_VALUES, defaultCAUnit } from '@/utils/number'
import { Prisma, UserChecklist } from '@prisma/client'
import { auth } from '../auth'
import { NOT_AUTHORIZED } from '../permissions/check'
import { canCreateOrganization, canDeleteOrganization, canUpdateOrganization } from '../permissions/organization'
import { CreateOrganizationCommand, UpdateOrganizationCommand } from './organization.command'
import { getStudy } from './study'
import { DeleteCommand } from './study.command'
import { addUserChecklistItem } from './user'
import { OnboardingCommand } from './user.command'

/**
 *
 * @param studyId the id of the study whose organization is being fetched
 * @returns the id and name of the organization if found, null otherwise
 * The security and authorization checks are made in the getStudy function
 * Chloé, if you consider refactoring this function, do not forget to add the security and authorization checks
 */
export const getStudyOrganization = async (studyId: string) => {
  const study = await getStudy(studyId)
  if (!study) {
    return null
  }
  return getOrganizationNameById(study.organizationId)
}

export const createOrganizationCommand = async (
  command: CreateOrganizationCommand,
): Promise<{ message: string; success: false } | { id: string; success: true }> => {
  const session = await auth()
  if (!session || !session.user.organizationId) {
    return { success: false, message: NOT_AUTHORIZED }
  }

  const organization = {
    ...command,
    isCR: false,
    activatedLicence: true,
    parent: { connect: { id: session.user.organizationId } },
  } satisfies Prisma.OrganizationCreateInput

  if (!(await canCreateOrganization(session.user))) {
    return { success: false, message: NOT_AUTHORIZED }
  }

  try {
    const createdOrganization = await createOrganization(organization)
    addUserChecklistItem(UserChecklist.AddClient)
    return { success: true, id: createdOrganization.id }
  } catch (e) {
    console.error(e)
    return { success: false, message: 'Something went wrong...' }
  }
}

export const updateOrganizationCommand = async (command: UpdateOrganizationCommand) => {
  const session = await auth()
  if (!session || !session.user.organizationId) {
    return NOT_AUTHORIZED
  }

  if (!(await canUpdateOrganization(session.user, command.organizationId))) {
    return NOT_AUTHORIZED
  }

  const userCAUnit = (await getUserApplicationSettings(session.user.accountId))?.caUnit
  const caUnit = CA_UNIT_VALUES[userCAUnit || defaultCAUnit]

  await updateOrganization(command, caUnit)
  const organization = await getOrganizationById(command.organizationId)
  addUserChecklistItem(organization?.isCR ? UserChecklist.AddSiteCR : UserChecklist.AddSiteOrga)
}

export const deleteOrganizationCommand = async ({ id, name }: DeleteCommand) => {
  if (!(await canDeleteOrganization(id))) {
    return NOT_AUTHORIZED
  }
  const organization = await getOrganizationNameById(id)
  if (!organization) {
    return NOT_AUTHORIZED
  }

  if (organization.name.toLowerCase() !== name.toLowerCase()) {
    return 'wrongName'
  }

  return deleteClient(id)
}

export const setOnboardedOrganization = async (organizationId: string) => {
  const session = await auth()
  const userOrganizationId = session?.user.organizationId

  if (!session || !userOrganizationId || userOrganizationId !== organizationId) {
    return NOT_AUTHORIZED
  }

  await setOnboarded(organizationId, session.user.accountId)
}

export const onboardOrganizationCommand = async (command: OnboardingCommand) => {
  const session = await auth()
  const organizationId = session?.user.organizationId

  if (!session || !organizationId || organizationId !== command.organizationId) {
    return NOT_AUTHORIZED
  }

  const organization = await getRawOrganizationById(command.organizationId)

  if (!organization || organization.onboarderId !== session.user.accountId) {
    return NOT_AUTHORIZED
  }

  // filter duplicatd email
  let collaborators = command.collaborators === undefined ? [] : uniqBy(command.collaborators, 'accountId')
  const existingCollaborators: AccountWithUser[] = []

  // filter existing accounts
  for (const collaborator of collaborators) {
    const existingAccount = (await getAccountById(collaborator.accountId || '')) as AccountWithUser
    if (existingAccount) {
      collaborators = collaborators.filter((commandCollaborator) => commandCollaborator.email !== collaborator.email)
      if (existingAccount.organizationId === organizationId) {
        existingCollaborators.push(existingAccount)
      }
    }
  }

  await onboardOrganization(session.user.accountId, { ...command, collaborators }, existingCollaborators)
}
