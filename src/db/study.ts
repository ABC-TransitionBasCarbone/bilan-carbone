import { User } from 'next-auth'
import { prismaClient } from './client'
import { type Prisma } from '@prisma/client'
import { getUserOrganizations } from './user'

export const createStudy = async (study: Prisma.StudyCreateInput) =>
  prismaClient.study.create({
    data: study,
  })

export const getStudyByUser = async (user: User) => {
  const userOrganizations = await getUserOrganizations(user.email)

  return prismaClient.study.findMany({
    where: { organizationId: { in: userOrganizations.map((organization) => organization.id) } },
  })
}
