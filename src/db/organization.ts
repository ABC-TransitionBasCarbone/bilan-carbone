import { UpdateOrganizationCommand } from '@/services/serverFunctions/organization.command'
import { sendNewUser } from '@/services/serverFunctions/user'
import { OnboardingCommand } from '@/services/serverFunctions/user.command'
import {
  Environment,
  Organization,
  OrganizationVersion,
  Prisma,
  Role,
  Site,
  UserSource,
  UserStatus,
} from '@prisma/client'
import { AccountWithUser } from './account'
import { prismaClient } from './client'
import { deleteStudy } from './study'

export type OrganizationVersionWithOrganization = OrganizationVersion & {
  organization: Organization & { sites: Site[] }
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
  environment: true,
  parentId: true,
  organization: {
    select: {
      oldBCId: true,
      id: true,
      name: true,
      sites: {
        select: { name: true, etp: true, ca: true, id: true, postalCode: true, city: true, cncId: true },
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

export const isOrganizationVersionCR = async (id: string | null) =>
  id ? (await prismaClient.organizationVersion.findUnique({ where: { id } }))?.isCR : undefined

export const getOrganizationVersionAccounts = (id: string | null) =>
  id
    ? prismaClient.account.findMany({
        select: { user: { select: { email: true, firstName: true, lastName: true, level: true } }, role: true },
        where: { organizationVersionId: id, user: { status: UserStatus.ACTIVE } },
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

export const getOrganizationWithSitesById = (id: string) =>
  prismaClient.organization.findUnique({
    where: { id },
    include: {
      sites: {
        select: { name: true, etp: true, ca: true, id: true, postalCode: true, city: true },
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
      activatedLicence: false,
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
        },
        update: {
          name: site.name,
          etp: site.etp,
          ca: (site?.ca || 0) * caUnit,
          postalCode: site.postalCode,
          city: site.city,
          cncId: site.cncId || undefined,
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

export const setOnboarded = (organizationVersionId: string, accountId: string) =>
  prismaClient.organizationVersion.update({
    where: { id: organizationVersionId },
    data: { onboarded: true, onboarderId: accountId },
  })

export const onboardOrganizationVersion = async (
  accountId: string,
  { organizationVersionId, companyName, firstName, lastName, collaborators = [] }: OnboardingCommand,
  existingCollaborators: AccountWithUser[],
) => {
  const userAccount = await prismaClient.account.findUnique({ where: { id: accountId } })
  if (!userAccount) {
    return
  }
  const dbUser = await prismaClient.user.findUnique({ where: { id: userAccount.userId } })

  if (!dbUser) {
    return
  }
  const newCollaborators: (Pick<AccountWithUser, 'role' | 'organizationVersionId'> & {
    user: { firstName: string; lastName: string; email: string; status: UserStatus; source: UserSource }
  })[] = []

  for (const collaborator of collaborators) {
    newCollaborators.push({
      user: {
        firstName: '',
        lastName: '',
        email: collaborator.email?.toLowerCase() || '',
        status: UserStatus.VALIDATED,
        source: dbUser.source,
      },
      role: collaborator.role === Role.ADMIN ? Role.GESTIONNAIRE : (collaborator.role ?? Role.DEFAULT),
      organizationVersionId,
    })
  }
  const organizationVersion = (await getOrganizationVersionById(
    organizationVersionId,
  )) as OrganizationVersionWithOrganization

  await prismaClient.$transaction(async (transaction) => {
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

    const collaboratorCreations = newCollaborators.map((collaborator) => {
      if (!collaborator.organizationVersionId) {
        return
      }
      return transaction.account.create({
        data: {
          role: collaborator.role,
          organizationVersion: { connect: { id: collaborator.organizationVersionId } },
          environment: organizationVersion.environment,
          user: {
            create: {
              firstName: collaborator.user.firstName,
              lastName: collaborator.user.lastName,
              email: collaborator.user.email,
              status: collaborator.user.status,
              source: collaborator.user.source,
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
  allCollaborators.forEach((collab) =>
    sendNewUser(collab.user.email.toLowerCase(), dbUser, collab.user.firstName ?? ''),
  )
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
      where: { organizationVersionId: organizationVersion.organizationId },
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

export const getRawOrganizationById = (id: string | null) =>
  id ? prismaClient.organization.findUnique({ where: { id } }) : null

export const createOrUpdateOrganization = async (
  organization: Prisma.OrganizationCreateInput & { id?: string },
  isCR?: boolean,
  activatedLicence?: boolean,
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
