import { Prisma, UserStatus } from '@prisma/client'
import { UpdateOrganizationCommand } from './../services/serverFunctions/organization.command'
import { prismaClient } from './client'

export const getRawOrganizationBySiret = (siret: string | null) =>
  siret ? prismaClient.organization.findFirst({ where: { siret: { startsWith: siret } } }) : null

export const getRawOrganizationById = (id: string | null) =>
  id ? prismaClient.organization.findUnique({ where: { id } }) : null

export const getOrganizationNameById = (id: string | null) =>
  id ? prismaClient.organization.findUnique({ where: { id }, select: { id: true, name: true } }) : null

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

export const createOrUpdateOrganization = (
  organization: Prisma.OrganizationCreateInput & { id?: string },
  isCR?: boolean,
  activatedLicence?: boolean,
  importedFileDate?: Date,
) =>
  prismaClient.organization.upsert({
    where: { id: organization.id ?? '' },
    update: {
      ...organization,
      isCR: isCR || organization.isCR,
      importedFileDate,
      activatedLicence: activatedLicence || organization.activatedLicence,
      updatedAt: new Date(),
    },
    create: {
      ...organization,
      importedFileDate,
      isCR: isCR || false,
      activatedLicence: activatedLicence || false,
    },
  })
