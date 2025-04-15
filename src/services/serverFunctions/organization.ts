'use server'

import { AccountWithUser, getAccountById } from '@/db/account'
import {
  createOrganizationWithVersion,
  deleteClient,
  getOrganizationNameByOrganizationVersionId,
  getOrganizationVersionById,
  onboardOrganizationVersion,
  setOnboarded,
  updateOrganization,
} from '@/db/organization'
import { getRawOrganizationVersionById } from '@/db/organizationImport'
import { getUserApplicationSettings } from '@/db/user'
import { uniqBy } from '@/utils/array'
import { CA_UNIT_VALUES, defaultCAUnit } from '@/utils/number'
import { Prisma, UserChecklist } from '@prisma/client'
import { auth } from '../auth'
import { NOT_AUTHORIZED } from '../permissions/check'
import {
  canCreateOrganization,
  canDeleteOrganizationVersion,
  canUpdateOrganizationVersion,
} from '../permissions/organization'
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
export const getStudyOrganizationVersion = async (studyId: string) => {
  const study = await getStudy(studyId)
  if (!study) {
    return null
  }
  return getOrganizationNameByOrganizationVersionId(study.organizationVersionId)
}

export const createOrganizationCommand = async (
  command: CreateOrganizationCommand,
): Promise<{ message: string; success: false } | { id: string; success: true }> => {
  // TODO pas trop sûr de si je m'y prend bien ici pour la création d'orga
  // On a dit que si y a un parentId on ne peut pas créer de version donc jsp trop ici j'ai dû retirer ces champs qui ne sont plus sur orga
  // ou alors ici je crée just eune version et je lui passe orgaId ? (c'est ce que j'ai fait pour le moment)

  const session = await auth()
  if (!session || !session.user.organizationVersionId) {
    return { success: false, message: NOT_AUTHORIZED }
  }

  const userOrganizationVersion = await getOrganizationVersionById(session.user.organizationVersionId)

  const organization = {
    ...command,
    parent: { connect: { id: userOrganizationVersion?.organizationId } },
  } satisfies Prisma.OrganizationCreateInput

  if (!(await canCreateOrganization(session.user))) {
    return { success: false, message: NOT_AUTHORIZED }
  }

  try {
    const createdOrganizationVersion = await createOrganizationWithVersion(organization)
    addUserChecklistItem(UserChecklist.AddClient)
    return { success: true, id: createdOrganizationVersion.id }
  } catch (e) {
    console.error(e)
    return { success: false, message: 'Something went wrong...' }
  }
}

export const updateOrganizationCommand = async (command: UpdateOrganizationCommand) => {
  const session = await auth()
  if (!session || !session.user.organizationVersionId) {
    return NOT_AUTHORIZED
  }

  if (!(await canUpdateOrganizationVersion(session.user, command.organizationVersionId))) {
    return NOT_AUTHORIZED
  }

  const userCAUnit = (await getUserApplicationSettings(session.user.accountId))?.caUnit
  const caUnit = CA_UNIT_VALUES[userCAUnit || defaultCAUnit]

  await updateOrganization(command, caUnit)
  const organizationVersion = await getOrganizationVersionById(command.organizationVersionId)
  addUserChecklistItem(organizationVersion?.isCR ? UserChecklist.AddSiteCR : UserChecklist.AddSiteOrga)
}

export const deleteOrganizationCommand = async ({ id, name }: DeleteCommand) => {
  // TODO ici aussi je delete juste la version ?
  if (!(await canDeleteOrganizationVersion(id))) {
    return NOT_AUTHORIZED
  }
  const organizationVersion = await getOrganizationNameByOrganizationVersionId(id)
  if (!organizationVersion) {
    return NOT_AUTHORIZED
  }

  if (organizationVersion.organization.name.toLowerCase() !== name.toLowerCase()) {
    return 'wrongName'
  }

  return deleteClient(id)
}

export const setOnboardedOrganizationVersion = async (organizationVersionId: string) => {
  const session = await auth()
  const userOrganizationVersionId = session?.user.organizationVersionId

  if (!session || !userOrganizationVersionId || userOrganizationVersionId !== organizationVersionId) {
    return NOT_AUTHORIZED
  }

  await setOnboarded(organizationVersionId, session.user.accountId)
}

export const onboardOrganizationVersionCommand = async (command: OnboardingCommand) => {
  const session = await auth()
  const organizationVersionId = session?.user.organizationVersionId

  if (!session || !organizationVersionId || organizationVersionId !== command.organizationVersionId) {
    return NOT_AUTHORIZED
  }

  const organizationVersion = await getRawOrganizationVersionById(command.organizationVersionId)

  if (!organizationVersion || organizationVersion.onboarderId !== session.user.accountId) {
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
      if (existingAccount.organizationVersionId === organizationVersionId) {
        existingCollaborators.push(existingAccount)
      }
    }
  }

  await onboardOrganizationVersion(session.user.accountId, { ...command, collaborators }, existingCollaborators)
}
