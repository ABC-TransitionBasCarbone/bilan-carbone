import { UpdateOrganizationCommand } from '@/services/serverFunctions/organization.command'
import { SitesCommand } from '@/services/serverFunctions/study.command'
import { OnboardingCommand } from '@/services/serverFunctions/user.command'
import { Environment, Organization, OrganizationVersion, Prisma, Site, UserStatus } from '@prisma/client'
import { prismaClient } from './client'
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

export const OrganizationVersionWithOrganizationSelect = {
  id: true,
  createdAt: true,
  updatedAt: true,
  organizationId: true,
  isCR: true,
  activatedLicence: true,
  onboarded: true,
  onboarderId: true,
  environment: true,
  parentId: true,
  parent: {
    select: {
      activatedLicence: true,
    },
  },
  organization: {
    select: {
      oldBCId: true,
      id: true,
      name: true,
      createdAt: true,
      updatedAt: true,
      importedFileDate: true,
      wordpressId: true,
      sites: {
        select: {
          name: true,
          etp: true,
          ca: true,
          id: true,
          createdAt: true,
          updatedAt: true,
          organizationId: true,
          oldBCId: true,
          postalCode: true,
          city: true,
          volunteerNumber: true,
          beneficiaryNumber: true,
          cncId: true,
          cnc: {
            select: {
              cncCode: true,
              seances: true,
              entrees2024: true,
              entrees2023: true,
              semainesActivite: true,
              latitude: true,
              longitude: true,
              cncVersionId: true,
            },
          },
        },
        orderBy: { createdAt: Prisma.SortOrder.asc },
      },
    },
  },
}

export const getOrganizationNameByOrganizationVersionId = (id: string | null) =>
  id
    ? prismaClient.organizationVersion.findUnique({
        where: { id },
        select: { id: true, organization: { select: { id: true, name: true } } },
      })
    : null

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
    select: OrganizationVersionWithOrganizationSelect,
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
  const organizationVersion = await getOrganizationVersionById(organizationVersionId)
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
  const organizationVersion = await getOrganizationVersionById(organizationVersionId)
  if (!organizationVersion) {
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
  const organizationVersion = (await getOrganizationVersionById(
    organizationVersionId,
  )) as OrganizationVersionWithOrganization

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

export const deleteClient = async (id: string) => {
  const organizationVersion = (await getOrganizationVersionById(id)) as OrganizationVersionWithOrganization
  const organization = await getOrganizationWithSitesById(organizationVersion.organizationId)

  const [clientUsers, clientChildren, clientEmissionFactors] = await Promise.all([
    prismaClient.account.findFirst({ where: { organizationVersionId: id } }),
    prismaClient.organizationVersion.findFirst({ where: { parentId: id } }),
    prismaClient.emissionFactor.findFirst({ where: { organizationId: organizationVersion.organizationId } }),
  ])
  if (clientUsers || clientChildren || clientEmissionFactors) {
    return 'unexpectedAssociations'
  }
  return prismaClient.$transaction(async (transaction) => {
    const studies = await transaction.study.findMany({
      where: { organizationVersionId: organizationVersion.id },
    })
    await Promise.all(studies.map((study) => deleteStudy(study.id)))
    await transaction.organizationVersion.delete({ where: { id } })

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
      activatedLicence: activatedLicence || organizationVersion?.activatedLicence,
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
