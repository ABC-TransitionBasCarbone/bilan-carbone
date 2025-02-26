import { UpdateOrganizationCommand } from '@/services/serverFunctions/organization.command'
import { sendNewUser } from '@/services/serverFunctions/user'
import { OnboardingCommand } from '@/services/serverFunctions/user.command'
import { Prisma, Role, User, UserStatus } from '@prisma/client'
import { prismaClient } from './client'

export const getRawOrganizationById = (id: string | null) =>
  id ? prismaClient.organization.findUnique({ where: { id } }) : null

export const getOrganizationById = (id: string | null) =>
  id ? prismaClient.organization.findUnique({ where: { id }, include: { childs: true } }) : null

export const getOrganizationUsers = (id: string | null) =>
  id
    ? prismaClient.user.findMany({
        select: { email: true, firstName: true, lastName: true, level: true, role: true },
        where: { organizationId: id, status: UserStatus.ACTIVE },
        orderBy: { email: 'asc' },
      })
    : []

export const getOrganizationWithSitesById = (id: string) =>
  prismaClient.organization.findUnique({
    where: { id },
    include: { sites: { select: { name: true, etp: true, ca: true, id: true }, orderBy: { createdAt: 'asc' } } },
  })

export const createOrganization = (organization: Prisma.OrganizationCreateInput) =>
  prismaClient.organization.create({
    data: organization,
  })

export const updateOrganization = ({ organizationId, sites, ...data }: UpdateOrganizationCommand, caUnit: number) =>
  prismaClient.$transaction([
    ...sites.map((site) =>
      prismaClient.site.upsert({
        where: { id: site.id },
        create: { id: site.id, organizationId, name: site.name, etp: site.etp, ca: site.ca * caUnit },
        update: { name: site.name, etp: site.etp, ca: site.ca * caUnit },
      }),
    ),
    prismaClient.site.deleteMany({ where: { organizationId, id: { notIn: sites.map((site) => site.id) } } }),
    prismaClient.organization.update({
      where: { id: organizationId },
      data: data,
    }),
  ])

export const setOnboarded = (organizationId: string, userId: string) =>
  prismaClient.organization.update({
    where: { id: organizationId },
    data: { onboarded: true, onboarderId: userId },
  })

export const onboardOrganization = async (
  userId: string,
  { organizationId, companyName, firstName, lastName, collaborators = [] }: OnboardingCommand,
  existingCollaborators: User[],
) => {
  const dbUser = await prismaClient.user.findUnique({ where: { id: userId } })
  if (!dbUser) {
    return
  }
  const role = dbUser.level ? Role.ADMIN : Role.GESTIONNAIRE
  const newCollaborators: Pick<User, 'firstName' | 'lastName' | 'email' | 'role' | 'status' | 'organizationId'>[] = []
  for (const collaborator of collaborators) {
    newCollaborators.push({
      firstName: '',
      lastName: '',
      email: collaborator.email || '',
      role: Role.DEFAULT,
      status: UserStatus.VALIDATED,
      organizationId,
    })
  }

  await prismaClient.$transaction(async (transaction) => {
    await Promise.all([
      transaction.organization.update({
        where: { id: organizationId },
        data: { name: companyName },
      }),
      transaction.user.update({
        where: { id: userId },
        data: { firstName, lastName, role },
      }),
      transaction.user.createMany({ data: newCollaborators }),
      existingCollaborators.map((collaborator) =>
        transaction.user.update({
          where: { id: collaborator.id },
          data: {
            role: collaborator.level || role === Role.GESTIONNAIRE ? role : Role.DEFAULT,
            status: UserStatus.VALIDATED,
          },
        }),
      ),
    ])
  })

  const allCollaborators = [...newCollaborators, ...existingCollaborators]
  allCollaborators.forEach((collab) => sendNewUser(collab.email, dbUser, collab.firstName ?? ''))
}
