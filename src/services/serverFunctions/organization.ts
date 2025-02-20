'use server'

import {
  createOrganization,
  getRawOrganizationById,
  onboardOrganization,
  setOnboarded,
  updateOrganization,
} from '@/db/organization'
import { getUserApplicationSettings, getUserByEmail } from '@/db/user'
import { uniqBy } from '@/utils/array'
import { CA_UNIT_VALUES, defaultCAUnit } from '@/utils/number'
import { Prisma } from '@prisma/client'
import { auth } from '../auth'
import { NOT_AUTHORIZED } from '../permissions/check'
import { canCreateOrganization, canUpdateOrganization } from '../permissions/organization'
import { CreateOrganizationCommand, UpdateOrganizationCommand } from './organization.command'
import { OnboardingCommand } from './user.command'

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
    activedLicence: true,
    parent: { connect: { id: session.user.organizationId } },
  } satisfies Prisma.OrganizationCreateInput

  if (!(await canCreateOrganization(session.user))) {
    return { success: false, message: NOT_AUTHORIZED }
  }

  try {
    const createdOrganization = await createOrganization(organization)
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

  if (!(await canUpdateOrganization(session.user, command))) {
    return NOT_AUTHORIZED
  }

  const userCAUnit = (await getUserApplicationSettings(session.user.id))?.caUnit
  const caUnit = userCAUnit ? CA_UNIT_VALUES[userCAUnit] : defaultCAUnit

  await updateOrganization(command, caUnit)
}

export const setOnboardedOrganization = async (organizationId: string) => {
  const session = await auth()
  const userOrganizationId = session?.user.organizationId

  if (!session || !userOrganizationId || userOrganizationId !== organizationId) {
    return NOT_AUTHORIZED
  }

  await setOnboarded(organizationId, session.user.id)
}

export const onboardOrganizationCommand = async (command: OnboardingCommand) => {
  const session = await auth()
  const organizationId = session?.user.organizationId

  if (!session || !organizationId || organizationId !== command.organizationId) {
    return NOT_AUTHORIZED
  }

  const organization = await getRawOrganizationById(command.organizationId)

  if (!organization || organization.onboarderId !== session.user.id) {
    return NOT_AUTHORIZED
  }

  // filter duplicatd email
  let collaborators = command.collaborators === undefined ? [] : uniqBy(command.collaborators, 'email')

  // filter existing users
  for (const collaborator of collaborators) {
    const existingUser = await getUserByEmail(collaborator.email || '')
    if (existingUser) {
      collaborators = collaborators.filter((commandCollaborator) => commandCollaborator.email !== collaborator.email)
    }
  }
  await onboardOrganization(session.user.id, { ...command, collaborators })
}
