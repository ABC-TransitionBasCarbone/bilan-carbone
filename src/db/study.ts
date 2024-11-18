import { User } from 'next-auth'
import { prismaClient } from './client'
import { StudyRole, SubPost, type Prisma } from '@prisma/client'
import { getUserOrganizations } from './user'

export const createStudy = (study: Prisma.StudyCreateInput) =>
  prismaClient.study.create({
    data: study,
  })

export const getStudyByUser = async (user: User) => {
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

export const getStudyById = async (id: string) => {
  return prismaClient.study.findUnique({
    where: { id },
    include: {
      emissionSources: {
        select: {
          id: true,
          subPost: true,
          name: true,
          dateLimite: true,
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
        },
        orderBy: [{ createdAt: 'asc' }, { name: 'asc' }],
      },
      contributors: {
        select: {
          user: {
            select: {
              email: true,
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
            },
          },
          role: true,
        },
        orderBy: { user: { email: 'asc' } },
      },
    },
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
