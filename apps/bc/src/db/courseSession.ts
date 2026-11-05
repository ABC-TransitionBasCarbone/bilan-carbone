import { getCourseSessionTraineeOrganizationData } from '@/services/courseSessionTraineeOrganization'
import { canRegisterForCourseSession } from '@/services/permissions/user'
import type { AddCourseSessionTraineeCommand } from '@/services/serverFunctions/courseSession.command'
import type { CourseSession, Environment, Prisma } from '@abc-transitionbascarbone/common/db'
import { Role, UserSource, UserStatus } from '@abc-transitionbascarbone/common/db/enums'
import { NOT_AUTHORIZED } from '@abc-transitionbascarbone/common/services/permissions/check'
import { UserSession } from 'next-auth'
import { prismaClient } from './client.server'
import { createUsersWithAccount } from './user'

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

export const getCourseSessionTrainees = async (courseSessionId: string, environment: Environment) => {
  const session = await prismaClient.courseSession.findUniqueOrThrow({
    where: { id: courseSessionId, environment },
    select: {
      traineeOrganizations: {
        select: {
          attendance: { select: { id: true } },
          organizationVersion: {
            select: {
              userAccounts: {
                where: { environment },
                select: {
                  id: true,
                  organizationVersionId: true,
                  user: { select: { firstName: true, lastName: true, email: true } },
                },
              },
            },
          },
        },
      },
    },
  })
  return session.traineeOrganizations
    .flatMap(({ attendance, organizationVersion }) =>
      organizationVersion.userAccounts.map((trainee) => ({ ...trainee, attendance })),
    )
    .sort((a, b) => a.user.lastName.localeCompare(b.user.lastName) || a.user.firstName.localeCompare(b.user.firstName))
}

export type CourseSessionTrainee = AsyncReturnType<typeof getCourseSessionTrainees>[number]

export const saveCourseSessionAttendance = (
  courseSessionId: string,
  professorOrganizationVersionId: string,
  environment: Environment,
  organizationVersionIds: string[],
) =>
  prismaClient.$transaction(
    async (transaction) => {
      const session = await transaction.courseSession.findFirst({
        where: { id: courseSessionId, professorOrganizationVersionId, environment },
        select: { id: true },
      })
      if (!session) {
        console.error('saveCourseSessionAttendance: session not authorized', {
          courseSessionId,
          professorOrganizationVersionId,
          environment,
        })
        throw new Error(NOT_AUTHORIZED)
      }

      const enrollments = await transaction.courseSessionTraineeOrganization.findMany({
        where: { courseSessionId },
        select: { id: true, organizationVersionId: true },
      })
      const selectedIds = new Set(organizationVersionIds)

      for (const enrollment of enrollments) {
        if (selectedIds.has(enrollment.organizationVersionId)) {
          await transaction.attendance.upsert({
            where: { courseSessionTraineeOrganizationId: enrollment.id },
            create: { courseSessionTraineeOrganizationId: enrollment.id },
            update: {},
          })
        }
      }
      await transaction.attendance.deleteMany({
        where: {
          traineeOrganization: {
            courseSessionId,
            organizationVersionId: { notIn: [...selectedIds] },
          },
        },
      })
    },
    { isolationLevel: 'Serializable' },
  )

export const createCourseParticipantAccounts = async (
  participants: (Pick<Prisma.UserCreateManyInput, 'email' | 'firstName' | 'lastName'> & { environment: Environment })[],
  transaction: Prisma.TransactionClient,
) => {
  if (!participants.length) {
    return { accounts: [], newUsers: { count: 0 }, newAccounts: { count: 0 } }
  }

  const counts = await createUsersWithAccount(
    participants.map(({ email, firstName, lastName, environment }) => ({
      email,
      firstName,
      lastName,
      source: UserSource.CRON,
      account: {
        environment,
        role: Role.DEFAULT,
        status: UserStatus.IMPORTED,
        user: { create: undefined, connectOrCreate: undefined, connect: undefined },
      },
    })),
    transaction,
  )
  const accounts = await transaction.account.findMany({
    where: {
      environment: { in: [...new Set(participants.map(({ environment }) => environment))] },
      user: { email: { in: participants.map(({ email }) => email) } },
    },
    select: {
      id: true,
      environment: true,
      organizationVersionId: true,
      user: { select: { email: true, firstName: true, lastName: true } },
    },
  })
  const accountsWithOrganizations = await Promise.all(
    accounts.map(async (account) => {
      if (account.organizationVersionId) {
        return account
      }
      const updatedAccount = await transaction.account.update({
        where: { id: account.id },
        data: {
          organizationVersion: {
            create: {
              environment: account.environment,
              organization: { create: { name: `${account.user.firstName} ${account.user.lastName}` } },
            },
          },
        },
        select: { organizationVersionId: true },
      })
      return { ...account, organizationVersionId: updatedAccount.organizationVersionId }
    }),
  )
  return { ...counts, accounts: accountsWithOrganizations }
}

export const prepareCourseSessionTraineeRegistrations = async (
  session: Pick<CourseSession, 'id' | 'type' | 'environment' | 'startDate' | 'endDate'>,
  organizationVersionIds: string[],
  transaction: Prisma.TransactionClient,
  options: { source: 'ftp' } | { source: 'manual'; confirmedSessionIds: string[] },
) => {
  const data = [...new Set(organizationVersionIds)].map((organizationVersionId) =>
    getCourseSessionTraineeOrganizationData(session, organizationVersionId),
  )
  const conflicts = data.length
    ? await transaction.courseSessionTraineeOrganization.findMany({
        where: {
          organizationVersionId: { in: data.map(({ organizationVersionId }) => organizationVersionId) },
          courseSessionId: { not: session.id },
          courseSession: { type: session.type, environment: session.environment },
        },
        select: { courseSessionId: true, organizationVersionId: true },
      })
    : []
  const previousSessionIds = [...new Set(conflicts.map(({ courseSessionId }) => courseSessionId))]
  const requiresConfirmation =
    options.source === 'manual' && previousSessionIds.some((id) => !options.confirmedSessionIds.includes(id))
  if (requiresConfirmation || !conflicts.length) {
    return { requiresConfirmation, data, previousSessionIds, removedCount: 0 }
  }

  const removed = await transaction.courseSessionTraineeOrganization.deleteMany({
    where: {
      courseSession: { type: session.type, environment: session.environment },
      OR: conflicts.map(({ courseSessionId, organizationVersionId }) => ({ courseSessionId, organizationVersionId })),
    },
  })
  if (options.source === 'manual') {
    const removedAt = new Date()
    for (const { courseSessionId, organizationVersionId } of conflicts) {
      await transaction.courseSessionTraineeRemoval.upsert({
        where: { courseSessionId_organizationVersionId: { courseSessionId, organizationVersionId } },
        create: { courseSessionId, organizationVersionId, removedAt },
        update: { removedAt },
      })
    }
  }
  return { requiresConfirmation: false, data, previousSessionIds, removedCount: removed.count }
}

export type CourseSessionTraineeRegistrationResult =
  | { status: 'confirmationRequired'; sessionIds: string[] }
  | { status: 'added' | 'alreadyRegistered' | 'transferred'; previousSessionIds: string[] }

export const registerCourseSessionTrainee = (
  courseSessionId: string,
  professorOrganizationVersionId: string,
  environment: Environment,
  trainee: AddCourseSessionTraineeCommand,
) =>
  prismaClient.$transaction<CourseSessionTraineeRegistrationResult>(
    async (transaction) => {
      const session = await transaction.courseSession.findFirst({
        where: { id: courseSessionId, environment },
        select: {
          id: true,
          type: true,
          startDate: true,
          endDate: true,
          professorOrganizationVersionId: true,
          environment: true,
        },
      })
      if (!session) {
        console.error('registerCourseSessionTrainee: session not authorized', {
          courseSessionId,
          professorOrganizationVersionId,
          environment,
        })
        throw new Error(NOT_AUTHORIZED)
      }

      const account = await transaction.account.findFirst({
        where: { environment, user: { email: trainee.email } },
        select: { id: true, organizationVersionId: true, role: true, status: true },
      })
      if (
        !canRegisterForCourseSession(
          { organizationVersionId: professorOrganizationVersionId, environment },
          session,
          account,
        )
      ) {
        console.error('registerCourseSessionTrainee: registration not authorized', {
          courseSessionId,
          professorOrganizationVersionId,
          accountId: account?.id,
          environment,
        })
        throw new Error(NOT_AUTHORIZED)
      }

      let organizationVersionId = account?.organizationVersionId
      if (!organizationVersionId) {
        const { accounts } = await createCourseParticipantAccounts([{ ...trainee, environment }], transaction)
        organizationVersionId = accounts[0]?.organizationVersionId
      }
      if (!organizationVersionId) {
        throw new Error('Missing organization version for course trainee')
      }

      const prepared = await prepareCourseSessionTraineeRegistrations(session, [organizationVersionId], transaction, {
        source: 'manual',
        confirmedSessionIds: trainee.confirmedTransferFrom ?? [],
      })
      if (prepared.requiresConfirmation) {
        return { status: 'confirmationRequired', sessionIds: prepared.previousSessionIds }
      }
      const registration = await transaction.courseSessionTraineeOrganization.createMany({
        data: prepared.data.map((data) => ({
          courseSessionId,
          ...data,
        })),
        skipDuplicates: true,
      })
      await transaction.courseSessionTraineeRemoval.deleteMany({ where: { courseSessionId, organizationVersionId } })
      return {
        status: prepared.removedCount ? 'transferred' : registration.count ? 'added' : 'alreadyRegistered',
        previousSessionIds: prepared.previousSessionIds,
      }
    },
    { isolationLevel: 'Serializable' },
  )

export const removeCourseSessionTrainee = (
  courseSessionId: string,
  organizationVersionId: string,
  professorOrganizationVersionId: string,
  environment: Environment,
) =>
  prismaClient.$transaction(
    async (transaction) => {
      const result = await transaction.courseSessionTraineeOrganization.deleteMany({
        where: {
          courseSessionId,
          organizationVersionId,
          courseSession: { professorOrganizationVersionId, environment },
        },
      })
      if (result.count) {
        const removedAt = new Date()
        await transaction.courseSessionTraineeRemoval.upsert({
          where: { courseSessionId_organizationVersionId: { courseSessionId, organizationVersionId } },
          create: { courseSessionId, organizationVersionId, removedAt },
          update: { removedAt },
        })
      }
      return result
    },
    { isolationLevel: 'Serializable' },
  )

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
