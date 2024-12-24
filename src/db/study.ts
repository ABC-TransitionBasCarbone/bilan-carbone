import { checkLevel } from '@/services/study'
import { Level, StudyRole, SubPost, type Prisma } from '@prisma/client'
import { User } from 'next-auth'
import { prismaClient } from './client'
import { getUserOrganizations } from './user'

export const createStudy = (study: Prisma.StudyCreateInput) =>
  prismaClient.study.create({
    data: study,
  })

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
      site: {
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
      user: {
        select: {
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
      user: {
        select: {
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
  exports: { select: { type: true, control: true } },
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

export const getMainStudy = async (organizationId: string) => {
  const study = await prismaClient.study.findFirst({
    where: { organizationId },
    include: fullStudyInclude,
    orderBy: { startDate: 'desc' },
  })
  if (!study) {
    return null
  }
  return { ...study, allowedUsers: normalizeAllowedUsers(study.allowedUsers, study.level, organizationId) }
}

export const getStudiesByUser = async (user: User) => {
  const userOrganizations = await getUserOrganizations(user.email)

  // Be carefull: study on this query is shown to a lot of user
  // Never display sensitive data here (like emission source)
  return prismaClient.study.findMany({
    where: {
      OR: [
        { organizationId: { in: userOrganizations.map((organization) => organization.id) } },
        { allowedUsers: { some: { userId: user.id } } },
        { contributors: { some: { userId: user.id } } },
      ],
    },
  })
}

export const getStudiesByUserAndOrganization = async (user: User, organizationId: string) => {
  return prismaClient.study.findMany({
    where: {
      organizationId,
      OR: [{ allowedUsers: { some: { userId: user.id } } }, { contributors: { some: { userId: user.id } } }],
    },
  })
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

export const updateStudySites = (studyId: string, newStudySites: Prisma.StudySiteCreateManyInput[]) => {
  prismaClient.$transaction([
    prismaClient.studySite.deleteMany({ where: { studyId } }),
    prismaClient.studySite.createMany({ data: newStudySites }),
  ])
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
          allowedUsers: { select: { userId: true } },
          contributors: { select: { userId: true } },
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
