import type { CourseAccountSelect } from '@/db/training.select'
import type { Prisma } from '@abc-transitionbascarbone/common/db'
import type { Environment } from '@abc-transitionbascarbone/common/db/enums'
import { isCourseEnvironment } from '@abc-transitionbascarbone/common/utils/environments'

export type CourseAccess = {
  isProfessor: boolean
  periods: { startDate: string; expiresAt: string }[]
}

export const isInTraining = (courseAccess?: CourseAccess, now = new Date()) =>
  courseAccess?.periods.some(({ startDate, expiresAt }) => new Date(startDate) <= now && now < new Date(expiresAt)) ??
  false

export const hasCourseAccess = (courseAccess?: CourseAccess) =>
  courseAccess?.isProfessor === true || isInTraining(courseAccess)

export const getTrainingAccessDays = () => {
  const value = process.env.TRAINING_ACCESS_DAYS
  const days = Number(value)
  if (!value?.trim() || !Number.isSafeInteger(days) || days < 0) {
    throw new Error('TRAINING_ACCESS_DAYS must be a non-negative integer')
  }
  return days
}

export const getCourseAccess = (
  account: Prisma.AccountGetPayload<{ select: typeof CourseAccountSelect }>,
): CourseAccess => {
  const days = getTrainingAccessDays()
  return {
    isProfessor: account.professorCourseSessions.length > 0,
    periods: account.traineeCourseSessions.map(({ courseSession }) => {
      const expiresAt = new Date(courseSession.endDate)
      expiresAt.setUTCDate(expiresAt.getUTCDate() + days)
      return { startDate: courseSession.startDate.toISOString(), expiresAt: expiresAt.toISOString() }
    }),
  }
}

export const withCourseAccess = <
  T extends Prisma.AccountGetPayload<{ select: typeof CourseAccountSelect }> & { environment: Environment },
>(
  account: T | null,
): (T & { courseAccess?: CourseAccess }) | null =>
  account
    ? {
        ...account,
        courseAccess: isCourseEnvironment(account.environment) ? getCourseAccess(account) : undefined,
      }
    : null
