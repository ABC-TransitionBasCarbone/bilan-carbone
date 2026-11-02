import { Prisma } from '@abc-transitionbascarbone/common/db'
import { Environment } from '@abc-transitionbascarbone/common/db/enums'
import { getJsDateFromExcel } from 'excel-date-to-js'
import { CourseParticipant, CourseSession } from './importTrainingSessionsType'

export const COURSE_ENVIRONMENT_BY_WORKBOOK_VALUE: Record<string, Environment> = {
  BC: Environment.COURSE_BC,
  TILT: Environment.COURSE_TILT,
}

export const sessionsSelect = {
  id: true,
  traineeOrganizations: {
    select: {
      organizationVersion: {
        select: { userAccounts: { select: { user: { select: { email: true, firstName: true, lastName: true } } } } },
      },
    },
  },
  professorOrganization: {
    select: { userAccounts: { select: { user: { select: { email: true, firstName: true, lastName: true } } } } },
  },
  courseOrganismId: true,
  name: true,
  type: true,
  environment: true,
  startDate: true,
  endDate: true,
  code: true,
} satisfies Prisma.CourseSessionSelect
export type SavedCourseSession = Prisma.CourseSessionGetPayload<{ select: typeof sessionsSelect }>

export const getProfessor = (session: SavedCourseSession) =>
  session.professorOrganization?.userAccounts[0]?.user ?? null

export const getTrainees = (session: SavedCourseSession) =>
  session.traineeOrganizations.flatMap(({ organizationVersion }) =>
    organizationVersion.userAccounts.map(({ user }) => user),
  )

export const getRequiredText = (record: Record<string, unknown>, field: string) => {
  const value = record[field]
  if (typeof value !== 'string' || !value.trim()) {
    console.error(`Missing ${field} in training sessions file`)
    return null
  }
  return value.trim()
}

const getRecordDate = (record: Record<string, unknown>, field: string) => {
  const value = record[field]
  const date =
    typeof value === 'number'
      ? getJsDateFromExcel(value)
      : value instanceof Date
        ? new Date(value)
        : typeof value === 'string'
          ? new Date(value)
          : undefined

  if (!date || Number.isNaN(date.getTime())) {
    throw new Error(`Invalid ${field} in training sessions file`)
  }
  return date
}

export const getDateAtMidnight = (record: Record<string, unknown>, field: string) => {
  const date = getRecordDate(record, field)
  date.setUTCHours(0, 0, 0, 0)
  return date
}

export const getRecordTimestamp = (record: Record<string, unknown>) => {
  const field = "Date d'ajout/modification de cette ligne"
  const value = record[field]
  return value == null || value === '' ? -Infinity : getRecordDate(record, field).getTime()
}

export const normalizeEmail = (record: Record<string, unknown>) => {
  return getRequiredText(record, 'Email')?.toLowerCase()
}

export const getParticipant = (record: Record<string, unknown>): CourseParticipant | null => {
  const email = normalizeEmail(record)
  const firstName = getRequiredText(record, 'Prénom')
  const lastName = getRequiredText(record, 'Nom')

  if (!email || !firstName || !lastName) {
    return null
  }

  return {
    email,
    firstName,
    lastName,
  }
}

export const getSession = (sessions: Map<string, CourseSession>, record: Record<string, unknown>) => {
  const name = getRequiredText(record, 'Nom de la session')
  const session = name ? sessions.get(name) : null
  if (!session) {
    console.error(`Unknown training session: ${name}`)
  }
  return session
}
