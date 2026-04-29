import { UpdateOrganizationCommand } from '@/services/serverFunctions/organization.command'
import { SitesCommand } from '@/services/serverFunctions/study.command'
import { OnboardingCommand } from '@/services/serverFunctions/user.command'
import { unique } from '@/utils/array'
import type { Organization, OrganizationVersion, Site } from '@repo/db-common'
import { Prisma } from '@repo/db-common'
import { Environment, EstablishmentType, UserStatus } from '@repo/db-common/enums'
import { prismaClient } from './client.server'
import { OrganizationVersionWithOrganizationSelect } from './organization.select'
import { deleteStudy } from './study'

export type OrganizationVersionWithOrganization = OrganizationVersion & {
  organization: Organization & {
    sites: (Site & {
      cnc: {
        cncCode: string | null
      } | null
    })[]
  }
}
export type OrganizationVersionWithOrganizationWithoutSites = OrganizationVersion & { organization: Organization }

export const getOrgNameByOrgVersionId = async (id: string | null) => {
  if (!id) {
    return null
  }

  const organizationVersion = await prismaClient.organizationVersion.findUnique({
    where: { id },
    select: { organization: { select: { name: true } } },
  })

  return organizationVersion?.organization?.name
}

export const getOrgVersionWithNameById = async (id: string | null) => {
  if (!id) {
    return null
  }
  return prismaClient.organizationVersion.findUnique({
    where: { id },
    select: { id: true, parentId: true, organization: { select: { id: true, name: true } } },
  })
}

export const getOrgVersionWithOrgId = async (id: string | null) => {
  if (!id) {
    return null
  }
  return prismaClient.organizationVersion.findUnique({
    where: { id },
    select: { organizationId: true },
  })
}

export const getOrganizationVersionForRightsCheck = (id: string | null) =>
  id
    ? prismaClient.organizationVersion.findUnique({
        where: { id },
        select: {
          id: true,
          environment: true,
          activatedLicence: true,
          parentId: true,
          parent: { select: { activatedLicence: true } },
        },
      })
    : null

export const getOrganizationVersionIsCR = async (id: string | null) => {
  if (!id) {
    return false
  }

  const organizationVersion = await prismaClient.organizationVersion.findUnique({
    where: { id },
    select: { isCR: true },
  })
  return organizationVersion?.isCR ?? false
}

export const organizationVersionExists = async (id: string | null) => {
  if (!id) {
    return false
  }
  const organizationVersion = await prismaClient.organizationVersion.findUnique({ where: { id }, select: { id: true } })
  return organizationVersion !== null
}

export const getOrgSitesWithCNCByOrgVersionId = async (id: string | null) => {
  if (!id) {
    return null
  }

  const organizationVersion = await prismaClient.organizationVersion.findUnique({
    where: { id },
    select: { organization: { select: { sites: { include: { cnc: true } } } } },
  })

  return organizationVersion?.organization.sites ?? null
}

// IMPORTANT: Do not use unless you need the full organization version with all its fields and relations.
export const getOrganizationVersionById = (id: string | null) =>
  id
    ? prismaClient.organizationVersion.findUnique({ where: { id }, select: OrganizationVersionWithOrganizationSelect })
    : null

export type OrganizationVersionWithParentLicence = Exclude<
  Awaited<ReturnType<typeof getOrganizationVersionById>>,
  'null'
>

export const isOrganizationVersionCR = async (id: string | null) =>
  id ? (await prismaClient.organizationVersion.findUnique({ where: { id } }))?.isCR : undefined

export const getOrganizationVersionAccounts = (id: string | null) =>
  id
    ? prismaClient.account.findMany({
        select: { user: { select: { email: true, firstName: true, lastName: true, level: true } }, role: true },
        where: { organizationVersionId: id, status: UserStatus.ACTIVE },
        orderBy: { user: { email: 'asc' } },
      })
    : []

export const getOrganizationVersionWithSitesById = (id: string) =>
  prismaClient.organizationVersion.findUnique({
    where: { id },
    select: OrganizationVersionWithOrganizationSelect,
  })

export const getOrganizationVersionByOrganizationIdAndEnvironment = (
  organizationId: string,
  environment: Environment,
) =>
  prismaClient.organizationVersion.findUnique({
    where: {
      organizationId_environment: {
        organizationId,
        environment,
      },
    },
    select: {
      id: true,
      environment: true,
      activatedLicence: true,
      isCR: true,
      parent: { select: { activatedLicence: true } },
    },
  })

export const getOrganizationVersionsByOrganizationId = (organizationId: string) =>
  prismaClient.organizationVersion.findMany({
    where: { organizationId },
    select: { id: true, environment: true, parentId: true },
  })

export const getOrganizationWithSitesById = (id: string) =>
  prismaClient.organization.findUnique({
    where: { id },
    include: {
      sites: {
        select: {
          name: true,
          etp: true,
          ca: true,
          id: true,
          postalCode: true,
          city: true,
          volunteerNumber: true,
          beneficiaryNumber: true,
          cnc: true,
        },
        orderBy: { createdAt: 'asc' },
      },
      organizationVersions: true,
    },
  })

export const createOrganizationWithVersion = async (
  organization: Prisma.OrganizationCreateInput,
  organizationVersion: Omit<Prisma.OrganizationVersionCreateInput, 'organization'>,
) => {
  const newOrganization = await prismaClient.organization.create({
    data: organization,
  })

  return prismaClient.organizationVersion.create({
    data: {
      ...organizationVersion,
      organization: { connect: { id: newOrganization.id } },
      isCR: false,
      activatedLicence: [],
    },
  })
}

export const updateOrganization = async (
  { organizationVersionId, sites, ...data }: UpdateOrganizationCommand,
  caUnit: number,
) => {
  const organizationVersion = await getOrgVersionWithOrgId(organizationVersionId)
  if (!organizationVersion) {
    return
  }

  return prismaClient.$transaction([
    ...sites.map((site) =>
      prismaClient.site.upsert({
        where: { id: site.id },
        create: {
          id: site.id,
          organizationId: organizationVersion.organizationId,
          name: site.name,
          etp: site.etp,
          ca: (site?.ca || 0) * caUnit,
          postalCode: site.postalCode,
          city: site.city,
          cncId: site.cncId || undefined,
          volunteerNumber: site.volunteerNumber || undefined,
          beneficiaryNumber: site.beneficiaryNumber || undefined,
          studentNumber: site.studentNumber || undefined,
          establishmentYear: site.establishmentYear?.toString() || undefined,
          academy: site.academy,
          establishmentType: site.establishmentType as EstablishmentType,
        },
        update: {
          name: site.name,
          etp: site.etp,
          ca: (site?.ca || 0) * caUnit,
          postalCode: site.postalCode,
          city: site.city,
          cncId: site.cncId || undefined,
          volunteerNumber: site.volunteerNumber || undefined,
          beneficiaryNumber: site.beneficiaryNumber || undefined,
          studentNumber: site.studentNumber || undefined,
          establishmentYear: site.establishmentYear?.toString() || undefined,
          academy: site.academy,
          establishmentType: site.establishmentType as EstablishmentType,
        },
      }),
    ),
    prismaClient.site.deleteMany({
      where: { organizationId: organizationVersion.organizationId, id: { notIn: sites.map((site) => site.id) } },
    }),
    prismaClient.organization.update({
      where: { id: organizationVersion.organizationId },
      data: data,
    }),
  ])
}

export const updateOrganizationSites = async (
  { sites }: SitesCommand,
  organizationVersionId: string,
  caUnit: number,
) => {
  if (!(await organizationVersionExists(organizationVersionId))) {
    return
  }

  return prismaClient.$transaction([
    ...sites.map((site) =>
      prismaClient.site.update({
        where: { id: site.id },
        data: {
          name: site.name,
          etp: site.etp,
          ca: (site?.ca || 0) * caUnit,
          postalCode: site.postalCode,
          city: site.city,
          cncId: site.cncId || undefined,
          volunteerNumber: site.volunteerNumber || undefined,
          beneficiaryNumber: site.beneficiaryNumber || undefined,
        },
      }),
    ),
  ])
}

export const setOnboarded = (organizationVersionId: string, accountId: string) =>
  prismaClient.organizationVersion.update({
    where: { id: organizationVersionId },
    data: { onboarded: true, onboarderId: accountId },
  })

export const onboardOrganizationVersion = async (
  accountId: string,
  { organizationVersionId, companyName, firstName, lastName }: Omit<OnboardingCommand, 'collaborators'>,
  transaction: Prisma.TransactionClient,
) => {
  const userAccount = await prismaClient.account.findUnique({ where: { id: accountId } })
  if (!userAccount) {
    return
  }
  const dbUser = await prismaClient.user.findUnique({ where: { id: userAccount.userId } })

  if (!dbUser) {
    return
  }
  const organizationVersion = await getOrgVersionWithOrgId(organizationVersionId)
  if (!organizationVersion) {
    return
  }

  await transaction.organization.update({
    where: { id: organizationVersion.organizationId },
    data: { name: companyName },
  })

  await transaction.account.update({
    where: { id: accountId },
    data: {
      user: {
        update: {
          firstName,
          lastName,
        },
      },
    },
  })
}

export const deleteClient = async (organizationVersionId: string) => {
  const organizationVersion = await getOrganizationVersionById(organizationVersionId)
  if (!organizationVersion) {
    return
  }

  const organization = await getOrganizationWithSitesById(organizationVersion.organizationId)

  const [clientUsers, clientChildren, clientEmissionFactors] = await Promise.all([
    prismaClient.account.findFirst({ where: { organizationVersionId: organizationVersionId } }),
    prismaClient.organizationVersion.findFirst({ where: { parentId: organizationVersionId } }),
    prismaClient.emissionFactor.findFirst({ where: { organizationId: organizationVersion.organizationId } }),
  ])
  if (clientUsers || clientChildren || clientEmissionFactors) {
    return 'unexpectedAssociations'
  }
  return prismaClient.$transaction(async (transaction) => {
    const studies = await transaction.study.findMany({
      where: { organizationVersionId },
    })
    await Promise.all(studies.map((study) => deleteStudy(study.id)))
    await transaction.organizationVersion.delete({ where: { id: organizationVersionId } })

    if (!organization?.organizationVersions.length) {
      return 'unexpectedAssociations'
    }

    await transaction.site.deleteMany({ where: { organizationId: organizationVersion.organizationId } })
    await transaction.organization.delete({ where: { id: organizationVersion.organizationId } })
  })
}
export const getRawOrganizationVersionById = (id: string | null) =>
  id ? prismaClient.organizationVersion.findUnique({ where: { id } }) : null

export const getRawOrganizationBySiret = (siret: string | null) =>
  siret ? prismaClient.organization.findFirst({ where: { wordpressId: { startsWith: siret } } }) : null

export const getRawOrganizationBySiteCNC = (cncCode: string | null) =>
  cncCode ? prismaClient.organization.findFirst({ where: { sites: { some: { cncId: cncCode } } } }) : null

export const getRawOrganizationBySiteEstablishmentId = (establishmentId: string | null) =>
  establishmentId ? prismaClient.organization.findFirst({ where: { sites: { some: { establishmentId } } } }) : null

export const getRawOrganizationById = (id: string | null) =>
  id ? prismaClient.organization.findUnique({ where: { id } }) : null

export const createOrUpdateOrganization = async (
  organization: Prisma.OrganizationCreateInput & { id?: string },
  isCR?: boolean,
  activatedLicence?: number[],
  importedFileDate?: Date,
  environment: Environment = Environment.BC,
) => {
  const updatedOrganization = await prismaClient.organization.upsert({
    where: { id: organization.id ?? '' },
    update: {
      importedFileDate,
    },
    create: {
      ...organization,
      importedFileDate,
    },
  })

  const organizationVersion = await getOrganizationVersionByOrganizationIdAndEnvironment(
    updatedOrganization.id,
    environment,
  )

  await prismaClient.organizationVersion.upsert({
    where: {
      organizationId_environment: {
        organizationId: updatedOrganization.id,
        environment,
      },
    },
    update: {
      isCR: isCR || organizationVersion?.isCR || false,
      updatedAt: new Date(),
      activatedLicence: unique([...(organizationVersion?.activatedLicence ?? []), ...(activatedLicence ?? [])]),
    },
    create: {
      organizationId: updatedOrganization.id,
      isCR: isCR || false,
      activatedLicence,
      onboarded: false,
      environment,
    },
  })

  return updatedOrganization
}
