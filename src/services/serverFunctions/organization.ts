'use server'

import { AccountWithUser, getAccountByEmailAndOrganizationVersionId } from '@/db/account'
import {
  createOrganizationWithVersion,
  deleteClient,
  getOrganizationNameByOrganizationVersionId,
  getOrganizationVersionById,
  getRawOrganizationVersionById,
  onboardOrganizationVersion,
  setOnboarded,
  updateOrganization,
} from '@/db/organization'
import { getUserApplicationSettings } from '@/db/user'
import { uniqBy } from '@/utils/array'
import { CA_UNIT_VALUES, defaultCAUnit } from '@/utils/number'
import { withServerResponse } from '@/utils/serverResponse'
import { Environment, Prisma, UserChecklist } from '@prisma/client'
import { auth } from '../auth'
import { NOT_AUTHORIZED, UNKNOWN_ERROR } from '../permissions/check'
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
    const session = await auth()
    if (!session || !session.user.organizationVersionId) {
      throw new Error(NOT_AUTHORIZED)
    }

    const organization = {
      ...command,
    } satisfies Prisma.OrganizationCreateInput

    const organizationVersion = {
      // TODO Récupérer l'environnement de la bonne manière
      environment: Environment.BC,
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
    const session = await auth()
    const userOrganizationVersionId = session?.user.organizationVersionId

    if (!session || !userOrganizationVersionId || userOrganizationVersionId !== organizationVersionId) {
      throw new Error(NOT_AUTHORIZED)
    }

    await setOnboarded(organizationVersionId, session.user.accountId)
  })

export const onboardOrganizationVersionCommand = async (command: OnboardingCommand) =>
  withServerResponse('onboardOrganizationVersionCommand', async () => {
    const session = await auth()
    const organizationVersionId = session?.user.organizationVersionId

    if (!session || !organizationVersionId || organizationVersionId !== command.organizationVersionId) {
      throw new Error(NOT_AUTHORIZED)
    }

    const organizationVersion = await getRawOrganizationVersionById(command.organizationVersionId)

    if (!organizationVersion || organizationVersion.onboarderId !== session.user.accountId) {
      throw new Error(NOT_AUTHORIZED)
    }

    // filter duplicatd email
    let collaborators = command.collaborators === undefined ? [] : uniqBy(command.collaborators, 'email')
    const existingCollaborators: AccountWithUser[] = []

    // filter existing accounts
    for (const collaborator of collaborators) {
      const existingAccount = (await getAccountByEmailAndOrganizationVersionId(
        collaborator.email || '',
        organizationVersionId,
      )) as AccountWithUser
      if (existingAccount) {
        collaborators = collaborators.filter((commandCollaborator) => commandCollaborator.email !== collaborator.email)
        if (existingAccount.organizationVersionId === organizationVersionId) {
          existingCollaborators.push(existingAccount)
        }
      }
    }

    await onboardOrganizationVersion(session.user.accountId, { ...command, collaborators }, existingCollaborators)
  })
