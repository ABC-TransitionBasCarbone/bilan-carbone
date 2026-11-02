import { UserSession } from 'next-auth'
import { prismaClient } from './client.server'

export const getProfessorCourseSessions = async (
  account: Pick<UserSession, 'organizationVersionId' | 'environment'>,
) => {
  if (!account.organizationVersionId) {
    return []
  }

  return prismaClient.courseSession.findMany({
    where: {
      professorOrganizationVersionId: account.organizationVersionId,
      environment: account.environment,
    },
    select: { id: true, name: true, startDate: true, endDate: true },
    orderBy: [{ startDate: 'desc' }, { name: 'asc' }],
  })
}

export type ProfessorCourseSession = AsyncReturnType<typeof getProfessorCourseSessions>[number]
