import { UpdateOrganizationCommand } from '@/services/serverFunctions/organization.command'
import { sendNewUser } from '@/services/serverFunctions/user'
import { OnboardingCommand } from '@/services/serverFunctions/user.command'
import { Environment, Prisma, Role, UserStatus } from '@prisma/client'
import { AccountWithUser } from './account'
import { prismaClient } from './client'
import { deleteStudy } from './study'

export const getOrganizationNameById = (id: string | null) =>
  id ? prismaClient.organization.findUnique({ where: { id }, select: { id: true, name: true } }) : null

export const getOrganizationById = (id: string | null) =>
  id ? prismaClient.organization.findUnique({ where: { id }, include: { childs: true } }) : null

export const getOrganizationAccounts = (id: string | null) =>
  id
    ? prismaClient.account.findMany({
        select: { user: { select: { email: true, firstName: true, lastName: true, level: true } }, role: true },
        where: { organizationId: id, user: { status: UserStatus.ACTIVE } },
        orderBy: { user: { email: 'asc' } },
      })
    : []

export const getOrganizationWithSitesById = (id: string) =>
  prismaClient.organization.findUnique({
    where: { id },
    include: {
      sites: {
        select: { name: true, etp: true, ca: true, id: true, postalCode: true, city: true },
        orderBy: { createdAt: 'asc' },
      },
    },
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
        create: {
          id: site.id,
          organizationId,
          name: site.name,
          etp: site.etp,
          ca: site.ca * caUnit,
          postalCode: site.postalCode,
          city: site.city,
        },
        update: { name: site.name, etp: site.etp, ca: site.ca * caUnit, postalCode: site.postalCode, city: site.city },
      }),
    ),
    prismaClient.site.deleteMany({ where: { organizationId, id: { notIn: sites.map((site) => site.id) } } }),
    prismaClient.organization.update({
      where: { id: organizationId },
      data: data,
    }),
  ])

export const setOnboarded = (organizationId: string, accountId: string) =>
  prismaClient.organization.update({
    where: { id: organizationId },
    data: { onboarded: true, onboarderId: accountId },
  })

export const onboardOrganization = async (
  accountId: string,
  { organizationId, companyName, firstName, lastName, collaborators = [] }: OnboardingCommand,
  existingCollaborators: AccountWithUser[],
) => {
  const dbUser = await prismaClient.user.findUnique({ where: { id: accountId } })
  if (!dbUser) {
    return
  }
  const role = dbUser.level ? Role.ADMIN : Role.GESTIONNAIRE
  const newCollaborators: (Pick<AccountWithUser, 'role' | 'organizationId'> & {
    user: { firstName: string; lastName: string; email: string; status: UserStatus }
  })[] = []
  for (const collaborator of collaborators) {
    newCollaborators.push({
      user: {
        firstName: '',
        lastName: '',
        email: collaborator.email?.toLowerCase() || '',
        status: UserStatus.VALIDATED,
      },
      role: collaborator.role === Role.ADMIN ? Role.GESTIONNAIRE : (collaborator.role ?? Role.DEFAULT),
      organizationId,
    })
  }

  await prismaClient.$transaction(async (transaction) => {
    await transaction.organization.update({
      where: { id: organizationId },
      data: { name: companyName },
    })

    await transaction.account.update({
      where: { id: accountId },
      data: {
        role,
        user: {
          update: {
            firstName,
            lastName,
          },
        },
      },
    })

    const collaboratorCreations = newCollaborators.map((collaborator) => {
      if (!collaborator.organizationId) {
        return
      }
      return transaction.account.create({
        data: {
          // TODO get Environment the right way
          environment: Environment.BC,
          role: collaborator.role,
          organization: { connect: { id: collaborator.organizationId } },
          user: {
            create: {
              firstName: collaborator.user.firstName,
              lastName: collaborator.user.lastName,
              email: collaborator.user.email,
              status: collaborator.user.status,
            },
          },
        },
      })
    })

    await Promise.all(collaboratorCreations)

    const collaboratorUpdates = existingCollaborators.map((collaborator) => {
      return transaction.account.update({
        where: { id: collaborator.id },
        data: {
          role:
            collaborator.user.level || collaborator.role !== Role.ADMIN
              ? collaborator.role
              : collaborator.role === Role.ADMIN
                ? Role.GESTIONNAIRE
                : Role.COLLABORATOR,
          user: {
            update: { status: UserStatus.VALIDATED },
          },
        },
      })
    })

    await Promise.all(collaboratorUpdates)
  })

  const allCollaborators = [...newCollaborators, ...existingCollaborators]
  allCollaborators.forEach((collab) => sendNewUser(collab.user.email.toLowerCase(), dbUser, collab.user.firstName ?? ''))
}

export const deleteClient = async (id: string) => {
  const [clientUsers, clientChildren, clientEmissionFactors] = await Promise.all([
    prismaClient.account.findFirst({ where: { organizationId: id } }),
    prismaClient.organization.findFirst({ where: { parentId: id } }),
    prismaClient.emissionFactor.findFirst({ where: { organizationId: id } }),
  ])
  if (clientUsers || clientChildren || clientEmissionFactors) {
    return 'unexpectedAssociations'
  }
  return prismaClient.$transaction(async (transaction) => {
    const studies = await transaction.study.findMany({ where: { organizationId: id } })
    await Promise.all(studies.map((study) => deleteStudy(study.id)))
    await transaction.site.deleteMany({ where: { organizationId: id } })
    await transaction.organization.delete({ where: { id } })
  })
}
