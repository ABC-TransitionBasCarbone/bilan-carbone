import { User } from 'next-auth'
import { prismaClient } from './client'
import { Study, type Prisma } from '@prisma/client'
import { getUserOrganizations } from './user'
import { UUID } from 'crypto'

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

export const getStudyByUserAndId = async (user: User, id: UUID): Promise<Study | null> => {
  const userOrganizations = await getUserOrganizations(user.email)

  return prismaClient.study.findUnique({
    where: { id, organizationId: { in: userOrganizations.map((organization) => organization.id) } },
  })
}
