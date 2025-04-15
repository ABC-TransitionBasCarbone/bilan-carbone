// TODO : merge this file with organization.ts after fixed aliases imports from script files
import { Environment, Prisma } from '@prisma/client'
import { prismaClient } from './client'

export const getRawOrganizationVersionById = (id: string | null) =>
  id ? prismaClient.organizationVersion.findUnique({ where: { id } }) : null

export const getRawOrganizationBySiret = (siret: string | null) =>
  siret ? prismaClient.organization.findFirst({ where: { wordpressId: { startsWith: siret } } }) : null

export const getRawOrganizationById = (id: string | null) =>
  id ? prismaClient.organization.findUnique({ where: { id } }) : null

export const createOrUpdateOrganization = async (
  organization: Prisma.OrganizationCreateInput & { id?: string },
  isCR?: boolean,
  activatedLicence?: boolean,
  importedFileDate?: Date,
) => {
  const updatedOrganization = await prismaClient.organization.upsert({
    where: { id: organization.id ?? '' },
    update: {
      importedFileDate,
      activatedLicence: activatedLicence || organization.activatedLicence,
    },
    create: {
      ...organization,
      importedFileDate,
    },
  })

  await prismaClient.organizationVersion.upsert({
    where: {
      organizationId_environment: {
        organizationId: updatedOrganization.id,
        environment: Environment.BC,
      },
    },
    update: {
      // TODO Récupérer isCR d'organizationVErsion ?
      isCR: isCR,
      activatedLicence,
      updatedAt: new Date(),
    },
    create: {
      organizationId: updatedOrganization.id,
      isCR: isCR || false,
      activatedLicence,
      onboarded: false,
      environment: Environment.BC,
    },
  })

  return updatedOrganization
}

export const createOrUpdateOrganizationWithVersion = async (
  organization: Prisma.OrganizationCreateInput & { id?: string },
  isCR?: boolean,
  activatedLicence?: boolean,
  importedFileDate?: Date,
  environment: Environment = Environment.BC,
) => {
  const updatedOrganization = await prismaClient.organization.upsert({
    where: { id: organization.id ?? '' },
    update: {
      ...organization,
      importedFileDate,
      updatedAt: new Date(),
    },
    create: {
      ...organization,
      importedFileDate,
    },
  })

  await prismaClient.organizationVersion.upsert({
    where: {
      organizationId_environment: {
        organizationId: updatedOrganization.id,
        environment,
      },
    },
    update: {
      isCR: isCR ?? undefined,
      activatedLicence: activatedLicence ?? undefined,
      updatedAt: new Date(),
    },
    create: {
      organizationId: updatedOrganization.id,
      isCR: isCR ?? false,
      activatedLicence: activatedLicence ?? false,
      environment,
    },
  })

  return updatedOrganization
}
