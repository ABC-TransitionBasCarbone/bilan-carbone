import type { CourseSession, Environment, Prisma } from '@abc-transitionbascarbone/common/db'
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

export const isCourseProfessor = async (
  organizationVersionId: string | null,
  environment: Environment,
  tx?: Prisma.TransactionClient,
) => {
  if (!organizationVersionId) {
    return false
  }

  const courseSession = await (tx ?? prismaClient).courseSession.findFirst({
    where: { professorOrganizationVersionId: organizationVersionId, environment },
    select: { id: true },
  })
  return !!courseSession
}

export const getCourseSessionForProfessor = (organizationVersionId: string, environment: Environment, id: string) =>
  prismaClient.courseSession.findFirst({
    where: {
      id,
      professorOrganizationVersionId: organizationVersionId,
      environment,
    },
    select: { id: true, name: true, type: true, startDate: true, endDate: true },
  })

export const getCourseSessionTrainees = (courseSessionId: string, environment: Environment) =>
  prismaClient.account.findMany({
    where: {
      environment,
      organizationVersion: { traineeCourseSessions: { some: { courseSessionId } } },
    },
    select: {
      id: true,
      organizationVersionId: true,
      user: { select: { firstName: true, lastName: true, email: true } },
    },
    orderBy: [{ user: { lastName: 'asc' } }, { user: { firstName: 'asc' } }],
  })

export type CourseSessionTrainee = AsyncReturnType<typeof getCourseSessionTrainees>[number]

export const removeCourseSessionTrainee = (
  courseSessionId: string,
  organizationVersionId: string,
  professorOrganizationVersionId: string,
  environment: Environment,
) =>
  prismaClient.courseSessionTraineeOrganization.deleteMany({
    where: {
      courseSessionId,
      organizationVersionId,
      courseSession: { professorOrganizationVersionId, environment },
    },
  })

export const getCourseSessionStudies = (
  session: Pick<CourseSession, 'id' | 'type'>,
  professorOrganizationVersionId: string,
  environment: Environment,
) =>
  prismaClient.study.findMany({
    where: {
      courseSessionType: session.type,
      organizationVersion: { environment },
      createdBy: {
        environment,
        organizationVersion: {
          traineeCourseSessions: {
            some: {
              courseSessionId: session.id,
              courseSession: {
                professorOrganizationVersionId,
                environment,
              },
            },
          },
        },
      },
    },
    select: { id: true },
    orderBy: [
      { createdBy: { user: { lastName: 'asc' } } },
      { createdBy: { user: { firstName: 'asc' } } },
      { name: 'asc' },
    ],
  })
