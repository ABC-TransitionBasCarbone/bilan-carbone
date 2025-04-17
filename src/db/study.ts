import { filterAllowedStudies } from '@/services/permissions/study'
import { isAdmin } from '@/services/permissions/user'
import { checkLevel, getAllowedLevels } from '@/services/study'
import { isAdminOnOrga } from '@/utils/organization'
import { getUserRoleOnPublicStudy } from '@/utils/study'
import { Import, Level, StudyRole, SubPost, type Prisma } from '@prisma/client'
import { UserSession } from 'next-auth'
import { getAccountOrganizationVersions } from './account'
import { prismaClient } from './client'
import { getOrganizationVersionById, OrganizationVersionWithOrganization } from './organization'

export const createStudy = async (data: Prisma.StudyCreateInput) => {
  const dbStudy = await prismaClient.study.create({ data })
  const studyEmissionFactorVersions = []
  for (const source of Object.values(Import).filter((source) => source !== Import.Manual)) {
    const latestImportVersion = await getSourceLatestImportVersionId(source)
    if (latestImportVersion) {
      studyEmissionFactorVersions.push({ studyId: dbStudy.id, source, importVersionId: latestImportVersion.id })
    }
  }
  await prismaClient.studyEmissionFactorVersion.createMany({ data: studyEmissionFactorVersions })
  return dbStudy
}

const fullStudyInclude = {
  emissionSources: {
    select: {
      id: true,
      subPost: true,
      name: true,
      caracterisation: true,
      value: true,
      reliability: true,
      technicalRepresentativeness: true,
      geographicRepresentativeness: true,
      temporalRepresentativeness: true,
      completeness: true,
      feReliability: true,
      feTechnicalRepresentativeness: true,
      feGeographicRepresentativeness: true,
      feTemporalRepresentativeness: true,
      feCompleteness: true,
      source: true,
      type: true,
      comment: true,
      validated: true,
      depreciationPeriod: true,
      hectare: true,
      duration: true,
      studySite: {
        select: {
          id: true,
        },
      },
      emissionFactorId: true,
      emissionFactor: {
        select: {
          id: true,
          totalCo2: true,
          unit: true,
          reliability: true,
          technicalRepresentativeness: true,
          geographicRepresentativeness: true,
          temporalRepresentativeness: true,
          completeness: true,
          importedFrom: true,
          importedId: true,
        },
      },
      contributor: {
        select: {
          id: true,
          user: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: [{ createdAt: 'asc' }, { name: 'asc' }],
  },
  contributors: {
    select: {
      accountId: true,
      account: {
        select: {
          id: true,
          organizationVersionId: true,
          user: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      },
      subPost: true,
    },
    orderBy: { account: { user: { email: 'asc' } } },
  },
  allowedUsers: {
    select: {
      accountId: true,
      account: {
        select: {
          id: true,
          organizationVersionId: true,
          user: {
            select: {
              id: true,
              email: true,
              level: true,
            },
          },
        },
      },
      role: true,
    },
    orderBy: { account: { user: { email: 'asc' } } },
  },
  sites: {
    select: {
      id: true,
      etp: true,
      ca: true,
      site: {
        select: {
          id: true,
          name: true,
          postalCode: true,
          city: true,
        },
      },
    },
  },
  emissionFactorVersions: {
    select: {
      id: true,
      importVersionId: true,
      source: true,
    },
  },
  exports: { select: { type: true, control: true } },
  organizationVersion: {
    select: {
      id: true,
      isCR: true,
      parentId: true,
      organization: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
  openingHours: true,
} satisfies Prisma.StudyInclude

const normalizeAllowedUsers = (
  allowedUsers: Prisma.StudyGetPayload<{ include: typeof fullStudyInclude }>['allowedUsers'],
  studyLevel: Level,
  organizationVersionId: string | null,
) =>
  allowedUsers.map((allowedUser) => {
    const readerOnly =
      !allowedUser.account.organizationVersionId || !checkLevel(allowedUser.account.user.level, studyLevel)
    return organizationVersionId && allowedUser.account.organizationVersionId === organizationVersionId
      ? { ...allowedUser, account: { ...allowedUser.account, readerOnly } }
      : {
          ...allowedUser,
          account: {
            ...allowedUser.account,
            organizationVersionId: undefined,
            level: undefined,
            readerOnly,
          },
        }
  })

export const getOrganizationVersionStudiesOrderedByStartDate = async (organizationVersionId: string) => {
  const studies = await prismaClient.study.findMany({
    where: {
      organizationVersionId,
    },
    include: fullStudyInclude,
    orderBy: { startDate: 'desc' },
  })
  return studies.map((study) => ({
    ...study,
    allowedUsers: normalizeAllowedUsers(study.allowedUsers, study.level, organizationVersionId),
  }))
}

export const getAllowedStudiesByAccount = async (user: UserSession) => {
  const accountOrganizationVersions = await getAccountOrganizationVersions(user.accountId)

  // Be carefull: study on this query is shown to a lot of user
  // Never display sensitive data here (like emission source)
  const studies = await prismaClient.study.findMany({
    where: {
      OR: [
        {
          AND: [
            {
              organizationVersionId: {
                in: accountOrganizationVersions.map((organizationVersion) => organizationVersion.id),
              },
            },
            ...(isAdmin(user.role) ? [] : [{ isPublic: true, level: { in: getAllowedLevels(user.level) } }]),
          ],
        },
        { allowedUsers: { some: { accountId: user.accountId } } },
        { contributors: { some: { accountId: user.accountId } } },
      ],
    },
  })
  return filterAllowedStudies(user, studies)
}

export const getExternalAllowedStudiesByUser = async (user: UserSession) => {
  const userOrganizationVersions = await getAccountOrganizationVersions(user.accountId)
  const studies = await prismaClient.study.findMany({
    where: {
      AND: [
        {
          organizationVersionId: {
            notIn: userOrganizationVersions.map((organizationVersion) => organizationVersion.id),
          },
        },
        {
          OR: [
            { allowedUsers: { some: { accountId: user.accountId } } },
            { contributors: { some: { accountId: user.accountId } } },
          ],
        },
      ],
    },
  })
  return filterAllowedStudies(user, studies)
}

export const getAllowedStudyIdByAccount = async (account: UserSession) => {
  const organizationVersionIds = (await getAccountOrganizationVersions(account.accountId)).map(
    (organizationVersion) => organizationVersion.id,
  )
  const isAllowedOnPublicStudies =
    account.level && getUserRoleOnPublicStudy(account, account.level) !== StudyRole.Reader
  const study = await prismaClient.study.findFirst({
    where: {
      OR: [
        { allowedUsers: { some: { accountId: account.id, role: { notIn: [StudyRole.Reader] } } } },
        ...(isAllowedOnPublicStudies
          ? [
              {
                AND: [
                  { organizationVersionId: { in: organizationVersionIds } },
                  ...(isAdmin(account.role)
                    ? []
                    : [{ isPublic: true, level: { in: getAllowedLevels(account.level) } }]),
                ],
              },
            ]
          : []),
      ],
    },
    orderBy: { createdAt: 'desc' },
  })
  return study?.id
}

export const getAllowedStudiesByUserAndOrganization = async (account: UserSession, organizationVersionId: string) => {
  const organizationVersion = await getOrganizationVersionById(organizationVersionId)

  if (!account.organizationVersionId) {
    return []
  }
  const childOrganizations = await prismaClient.organizationVersion.findMany({
    where: { parentId: account.organizationVersionId },
    select: { id: true },
  })

  const studies = await prismaClient.study.findMany({
    where: {
      organizationVersionId,
      ...(isAdminOnOrga(account, organizationVersion as OrganizationVersionWithOrganization)
        ? {}
        : {
            OR: [
              { allowedUsers: { some: { accountId: account.id } } },
              { contributors: { some: { accountId: account.id } } },
              { isPublic: true, organizationVersionId: account.organizationVersionId as string },
              {
                isPublic: true,
                organizationVersionId: {
                  in: childOrganizations.map((organizationVersion) => organizationVersion.id),
                },
              },
            ],
          }),
    },
  })
  return filterAllowedStudies(account, studies)
}

export const getStudyById = async (id: string, organizationVersionId: string | null) => {
  const study = await prismaClient.study.findUnique({
    where: { id },
    include: fullStudyInclude,
  })
  if (!study) {
    return null
  }
  return { ...study, allowedUsers: normalizeAllowedUsers(study.allowedUsers, study.level, organizationVersionId) }
}
export type FullStudy = Exclude<AsyncReturnType<typeof getStudyById>, null>

export const getStudyNameById = async (id: string) => {
  const study = await prismaClient.study.findUnique({
    where: { id },
    select: { name: true },
  })
  if (!study) {
    return null
  }
  return study.name
}

export const createUserOnStudy = async (right: Prisma.UserOnStudyCreateInput) =>
  prismaClient.userOnStudy.create({
    data: right,
  })

export const updateUserOnStudy = (accountId: string, studyId: string, role: StudyRole) =>
  prismaClient.userOnStudy.update({
    where: {
      studyId_accountId: {
        accountId,
        studyId,
      },
    },
    data: {
      role,
    },
  })

export const updateStudy = (id: string, data: Prisma.StudyUpdateInput) =>
  prismaClient.study.update({ where: { id }, data })

export const downgradeStudyUserRoles = (studyId: string, accountIds: string[]) =>
  Promise.all(
    accountIds.map((accountId) =>
      prismaClient.userOnStudy.update({
        where: { studyId_accountId: { studyId, accountId } },
        data: { role: StudyRole.Reader },
      }),
    ),
  )

export const getStudySites = (studyId: string) => prismaClient.studySite.findMany({ where: { studyId } })

export const updateStudySites = async (
  studyId: string,
  newStudySites: Prisma.StudySiteCreateManyInput[],
  deletedSiteIds: string[],
) => {
  return prismaClient.$transaction(async (transaction) => {
    const promises = []
    if (deletedSiteIds.length) {
      await transaction.studyEmissionSource.deleteMany({ where: { studyId, studySiteId: { in: deletedSiteIds } } })
      promises.push(transaction.studySite.deleteMany({ where: { id: { in: deletedSiteIds }, studyId } }))
    }
    if (newStudySites.length) {
      newStudySites.forEach((studySite) => {
        promises.push(
          transaction.studySite.upsert({
            where: { studyId_siteId: { studyId, siteId: studySite.siteId } },
            update: { ca: studySite.ca, etp: studySite.etp },
            create: studySite,
          }),
        )
      })
    }

    return Promise.all(promises)
  })
}

export const deleteStudy = async (id: string) => {
  return prismaClient.$transaction(async (transaction) => {
    await Promise.all([
      transaction.userOnStudy.deleteMany({ where: { studyId: id } }),
      transaction.studyEmissionSource.deleteMany({ where: { studyId: id } }),
      transaction.contributors.deleteMany({ where: { studyId: id } }),
      transaction.studySite.deleteMany({ where: { studyId: id } }),
      transaction.document.deleteMany({ where: { studyId: id } }),
      transaction.studyEmissionFactorVersion.deleteMany({ where: { studyId: id } }),
      transaction.studyExport.deleteMany({ where: { studyId: id } }),
    ])
    await transaction.study.delete({ where: { id } })
  })
}

export const createContributorOnStudy = (
  accountId: string,
  subPosts: SubPost[],
  data: Omit<Prisma.ContributorsCreateManyInput, 'accountId' | 'subPost'>,
) =>
  prismaClient.contributors.createMany({
    data: subPosts.map((subPost) => ({ ...data, accountId, subPost })),
    skipDuplicates: true,
  })

export const getStudiesFromSites = async (siteIds: string[]) =>
  prismaClient.studySite.findMany({
    where: {
      siteId: {
        in: siteIds,
      },
    },
    include: {
      study: {
        select: {
          name: true,
          isPublic: true,
          level: true,
          allowedUsers: { select: { accountId: true } },
          contributors: { select: { accountId: true } },
          organizationVersionId: true,
          organizationVersion: {
            select: {
              id: true,
              isCR: true,
              parentId: true,
              organization: {
                select: { id: true },
              },
            },
          },
        },
      },
      site: {
        select: {
          name: true,
          organization: {
            select: {
              id: true,
              name: true,
              organizationVersions: {
                select: {
                  isCR: true,
                },
              },
            },
          },
        },
      },
    },
  })

export const getStudyValidatedEmissionsSources = async (studyId: string) => {
  const study = await prismaClient.study.findUnique({
    where: { id: studyId },
    select: { emissionSources: { select: { validated: true } } },
  })

  if (!study) {
    return null
  }
  return {
    total: study.emissionSources.length,
    validated: study.emissionSources.filter((emissionSource) => emissionSource.validated).length,
  }
}

const getSourceLatestImportVersionId = async (source: Import, transaction?: Prisma.TransactionClient) =>
  (transaction || prismaClient).emissionFactorImportVersion.findFirst({
    select: { id: true, source: true },
    where: { source },
    orderBy: { createdAt: 'desc' },
  })
