// TODO : merge this file with organization.ts after fixed aliases imports from script files
import { Prisma } from '@prisma/client'
import { prismaClient } from './client'

export const getRawOrganizationBySiret = (siret: string | null) =>
  siret ? prismaClient.organization.findFirst({ where: { siret: { startsWith: siret } } }) : null

export const getRawOrganizationById = (id: string | null) =>
  id ? prismaClient.organization.findUnique({ where: { id } }) : null

export const createOrUpdateOrganization = (
  organization: Prisma.OrganizationCreateInput & { id?: string },
  isCR?: boolean,
  activatedLicence?: boolean,
  importedFileDate?: Date,
) =>
  prismaClient.organization.upsert({
    where: { id: organization.id ?? '' },
    update: {
      isCR: isCR || organization.isCR,
      importedFileDate,
      activatedLicence: activatedLicence || organization.activatedLicence,
    },
    create: {
      ...organization,
      importedFileDate,
      isCR: isCR || false,
      activatedLicence: activatedLicence || false,
    },
  })
