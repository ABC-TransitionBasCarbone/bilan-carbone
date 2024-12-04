import { StudyRole, SubPost, type Prisma } from '@prisma/client'
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
      tag: true,
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
          name: true,
        },
      },
    },
  },
  exports: { select: { type: true } },
} satisfies Prisma.StudyInclude

export const getMainStudy = async (user: User) => {
  const userOrganizations = await getUserOrganizations(user.email)
  return prismaClient.study.findFirst({
    where: {
      OR: [
        { organizationId: { in: userOrganizations.map((organization) => organization.id) } },
        { allowedUsers: { some: { userId: user.id } } },
        { contributors: { some: { userId: user.id } } },
      ],
    },
    include: fullStudyInclude,
    orderBy: { startDate: 'desc' },
  })
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

export const getStudyById = async (id: string) => {
  return prismaClient.study.findUnique({
    where: { id },
    include: fullStudyInclude,
  })
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

export const createContributorOnStudy = (
  userId: string,
  subPosts: SubPost[],
  data: Omit<Prisma.ContributorsCreateManyInput, 'userId' | 'subPost'>,
) =>
  prismaClient.contributors.createMany({
    data: subPosts.map((subPost) => ({ ...data, userId, subPost })),
    skipDuplicates: true,
  })
