'use server'

import { createOrganization, updateOrganization } from '@/db/organization'
import { Prisma } from '@prisma/client'
import { auth } from '../auth'
import { NOT_AUTHORIZED } from '../permissions/check'
import { canCreateOrganization, canUpdateOrganization } from '../permissions/organization'
import { CreateOrganizationCommand, UpdateOrganizationCommand } from './organization.command'

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

  const { organizationId, ...data } = command
  await updateOrganization(organizationId, data)
}
