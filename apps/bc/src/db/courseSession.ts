import { UserSession } from 'next-auth'
import { prismaClient } from './client.server'

export const getProfessorCourseSessions = (account: Pick<UserSession, 'accountId' | 'environment'>) =>
  prismaClient.courseSession.findMany({
    where: { professorId: account.accountId, environment: account.environment },
    select: { id: true, name: true, startDate: true, endDate: true },
    orderBy: [{ startDate: 'desc' }, { name: 'asc' }],
  })

export type ProfessorCourseSession = AsyncReturnType<typeof getProfessorCourseSessions>[number]
