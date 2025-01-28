import { UpdateOrganizationCommand } from '@/services/serverFunctions/organization.command'
import { OnboardingCommand } from '@/services/serverFunctions/user.command'
import { Prisma, Role } from '@prisma/client'
import { prismaClient } from './client'

export const getRawOrganizationById = (id: string | null) =>
  id ? prismaClient.organization.findUnique({ where: { id } }) : null

export const getOrganizationById = (id: string | null) =>
  id ? prismaClient.organization.findUnique({ where: { id }, include: { childs: true } }) : null

export const getOrganizationUsers = (id: string | null) =>
  id
    ? prismaClient.user.findMany({
        select: { email: true, firstName: true, lastName: true, level: true, role: true },
        where: { organizationId: id, isActive: true },
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

export const updateOrganization = ({ organizationId, sites, ...data }: UpdateOrganizationCommand) =>
  prismaClient.$transaction([
    ...sites.map((site) =>
      prismaClient.site.upsert({
        where: { id: site.id },
        create: { id: site.id, organizationId, name: site.name, etp: site.etp, ca: site.ca * 1000 },
        update: { name: site.name, etp: site.etp, ca: site.ca * 1000 },
      }),
    ),
    prismaClient.site.deleteMany({ where: { organizationId, id: { notIn: sites.map((site) => site.id) } } }),
    prismaClient.organization.update({
      where: { id: organizationId },
      data: data,
    }),
  ])

export const setOnboarded = (organizationId: string) =>
  prismaClient.organization.update({
    where: { id: organizationId },
    data: { onboarded: true },
  })

export const onboardOrganization = async (
  userId: string,
  { organizationId, companyName, role, collaborators = [] }: OnboardingCommand,
) => {
  await prismaClient.$transaction(async (transaction) => {
    const newCollaborators = []
    for (const collaborator of collaborators) {
      newCollaborators.push({
        firstName: '',
        lastName: '',
        email: collaborator.email || '',
        role: collaborator.role || Role.DEFAULT,
        isActive: false,
        isValidated: true,
        organizationId,
      })
    }

    await Promise.all([
      transaction.organization.update({
        where: { id: organizationId },
        data: { name: companyName },
      }),
      transaction.user.update({
        where: { id: userId },
        data: { role },
      }),
      transaction.user.createMany({ data: newCollaborators }),
    ])
  })
}
