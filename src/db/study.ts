import { filterAllowedStudies } from '@/services/permissions/study'
import { isAdmin } from '@/services/permissions/user'
import { checkLevel, getAllowedLevels } from '@/services/study'
import { isAdminOnOrga } from '@/utils/organization'
import { getUserRoleOnPublicStudy } from '@/utils/study'
import { Import, Level, StudyRole, SubPost, type Prisma } from '@prisma/client'
import { User } from 'next-auth'
import { prismaClient } from './client'
import { getOrganizationById } from './organization'
import { getUserOrganizations } from './user'

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
          email: true,
        },
      },
    },
    orderBy: [{ createdAt: 'asc' }, { name: 'asc' }],
  },
  contributors: {
    select: {
      userId: true,
      user: {
        select: {
          id: true,
          email: true,
          organizationId: true,
        },
      },
      subPost: true,
    },
    orderBy: { user: { email: 'asc' } },
  },
  allowedUsers: {
    select: {
      userId: true,
      user: {
        select: {
          id: true,
          email: true,
          organizationId: true,
          level: true,
        },
      },
      role: true,
    },
    orderBy: { user: { email: 'asc' } },
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
  organization: { select: { id: true, name: true, isCR: true, parentId: true } },
} satisfies Prisma.StudyInclude

const normalizeAllowedUsers = (
  allowedUsers: Prisma.StudyGetPayload<{ include: typeof fullStudyInclude }>['allowedUsers'],
  studyLevel: Level,
  organizationId: string | null,
) =>
  allowedUsers.map((allowedUser) => {
    const readerOnly = !allowedUser.user.organizationId || !checkLevel(allowedUser.user.level, studyLevel)
    return organizationId && allowedUser.user.organizationId === organizationId
      ? { ...allowedUser, user: { ...allowedUser.user, readerOnly } }
      : {
          ...allowedUser,
          user: {
            ...allowedUser.user,
            organizationId: undefined,
            level: undefined,
            readerOnly,
          },
        }
  })

export const getOrganizationStudiesOrderedByStartDate = async (organizationId: string) => {
  const studies = await prismaClient.study.findMany({
    where: {
      organizationId,
    },
    include: fullStudyInclude,
    orderBy: { startDate: 'desc' },
  })
  return studies.map((study) => ({
    ...study,
    allowedUsers: normalizeAllowedUsers(study.allowedUsers, study.level, organizationId),
  }))
}

export const getAllowedStudiesByUser = async (user: User) => {
  const userOrganizations = await getUserOrganizations(user.email)

  // Be carefull: study on this query is shown to a lot of user
  // Never display sensitive data here (like emission source)
  const studies = await prismaClient.study.findMany({
    where: {
      OR: [
        {
          AND: [
            { organizationId: { in: userOrganizations.map((organization) => organization.id) } },
            ...(isAdmin(user.role) ? [] : [{ isPublic: true, level: { in: getAllowedLevels(user.level) } }]),
          ],
        },
        { allowedUsers: { some: { userId: user.id } } },
        { contributors: { some: { userId: user.id } } },
      ],
    },
  })
  return filterAllowedStudies(user, studies)
}

export const getAllowedStudyIdByUser = async (user: User) => {
  const organizationIds = (await getUserOrganizations(user.email)).map((organization) => organization.id)
  const isAllowedOnPublicStudies = user.level && getUserRoleOnPublicStudy(user, user.level) !== StudyRole.Reader
  const study = await prismaClient.study.findFirst({
    where: {
      OR: [
        { allowedUsers: { some: { userId: user.id, role: { notIn: [StudyRole.Reader] } } } },
        ...(isAllowedOnPublicStudies
          ? [
              {
                AND: [
                  { organizationId: { in: organizationIds } },
                  ...(isAdmin(user.role) ? [] : [{ isPublic: true, level: { in: getAllowedLevels(user.level) } }]),
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

export const getAllowedStudiesByUserAndOrganization = async (user: User, organizationId: string) => {
  const childOrganizations = await prismaClient.organization.findMany({
    where: { parentId: user.organizationId },
    select: { id: true },
  })

  const userOrga = await getOrganizationById(user.organizationId)
  if (!userOrga) {
    return []
  }

  const studies = await prismaClient.study.findMany({
    where: {
      organizationId,
      ...(isAdminOnOrga(user, userOrga)
        ? {}
        : {
            OR: [
              { allowedUsers: { some: { userId: user.id } } },
              { contributors: { some: { userId: user.id } } },
              { isPublic: true, organizationId: user.organizationId as string },
              { isPublic: true, organizationId: { in: childOrganizations.map((organization) => organization.id) } },
            ],
          }),
    },
  })
  return filterAllowedStudies(user, studies)
}

export const getStudyById = async (id: string, organizationId: string | null) => {
  const study = await prismaClient.study.findUnique({
    where: { id },
    include: fullStudyInclude,
  })
  if (!study) {
    return null
  }
  return { ...study, allowedUsers: normalizeAllowedUsers(study.allowedUsers, study.level, organizationId) }
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

export const updateUserOnStudy = (userId: string, studyId: string, role: StudyRole) =>
  prismaClient.userOnStudy.update({
    where: {
      studyId_userId: {
        userId,
        studyId,
      },
    },
    data: {
      role,
    },
  })

export const updateStudy = (id: string, data: Prisma.StudyUpdateInput) =>
  prismaClient.study.update({ where: { id }, data })

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
  userId: string,
  subPosts: SubPost[],
  data: Omit<Prisma.ContributorsCreateManyInput, 'userId' | 'subPost'>,
) =>
  prismaClient.contributors.createMany({
    data: subPosts.map((subPost) => ({ ...data, userId, subPost })),
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
          allowedUsers: { select: { userId: true } },
          contributors: { select: { userId: true } },
          organizationId: true,
          organization: {
            select: {
              id: true,
              parentId: true,
            },
          },
        },
      },
      site: {
        select: {
          name: true,
          organization: {
            select: { id: true, isCR: true, name: true },
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
