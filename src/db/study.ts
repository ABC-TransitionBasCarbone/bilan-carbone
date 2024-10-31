import { User } from 'next-auth'
import { prismaClient } from './client'
import { StudyRole, type Prisma } from '@prisma/client'
import { getUserOrganizations } from './user'
import { UUID } from 'crypto'

export const createStudy = (study: Prisma.StudyCreateInput) =>
  prismaClient.study.create({
    data: study,
  })

export const getStudyByUser = async (user: User) => {
  const userOrganizations = await getUserOrganizations(user.email)

  return prismaClient.study.findMany({
    where: {
      OR: [
        { organizationId: { in: userOrganizations.map((organization) => organization.id) } },
        { allowedUsers: { some: { userId: user.id } } },
      ],
    },
  })
}

export const getStudyById = (id: UUID) => {
  return prismaClient.study.findUnique({
    where: { id },
  })
}

export const getStudyWithRightsById = (id: string) => {
  return prismaClient.study.findUnique({
    where: { id },
    include: {
      allowedUsers: {
        select: {
          user: {
            select: {
              email: true,
            },
          },
          role: true,
        },
      },
    },
  })
}
export type StudyWithRights = Exclude<AsyncReturnType<typeof getStudyWithRightsById>, null>

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
