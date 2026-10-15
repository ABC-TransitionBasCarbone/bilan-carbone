import { prismaClient } from '@/db/client.server'
import { createUsersWithAccount } from '@/db/user'
import { getRecords, type Worksheet } from '@/utils/excel.utils'
import type { Prisma } from '@abc-transitionbascarbone/common/db'
import { Environment, Role, UserSource, UserStatus } from '@abc-transitionbascarbone/common/db/enums'
import {
  sendCourseSessionsCreatedEmail,
  type TrainingSessionUpdate,
} from '@abc-transitionbascarbone/common/services/email/email'
import { AccessOptions, Client } from 'basic-ftp'
import { randomInt } from 'crypto'
import { getJsDateFromExcel } from 'excel-date-to-js'
import fs from 'fs'
import xlsx from 'node-xlsx'
import path from 'path'

type CourseParticipant = {
  email: string
  firstName: string
  lastName: string
}

type CourseSession = {
  courseOrganismId: string
  name: string
  startDate: Date
  endDate: Date
  environment: Environment
  trainees: CourseParticipant[]
  professor: CourseParticipant | null
}

const COURSE_ENVIRONMENT_BY_WORKBOOK_VALUE: Record<string, Environment> = {
  BC: Environment.COURSE_BC,
  TILT: Environment.COURSE_TILT,
}

const sessionEmailSelect = {
  id: true,
  trainees: {
    select: {
      account: { select: { user: { select: { email: true, firstName: true, lastName: true } } } },
    },
  },
  professor: { select: { user: { select: { email: true, firstName: true, lastName: true } } } },
  courseOrganismId: true,
  name: true,
  environment: true,
  startDate: true,
  endDate: true,
  traineeCode: true,
  professorCode: true,
} satisfies Prisma.CourseSessionSelect

type SavedCourseSession = Prisma.CourseSessionGetPayload<{ select: typeof sessionEmailSelect }>

const getSessionUpdate = (before: SavedCourseSession, after: SavedCourseSession): TrainingSessionUpdate | null => {
  const dates: TrainingSessionUpdate['dates'] = []
  if (before.startDate.getTime() !== after.startDate.getTime()) {
    dates.push({ label: 'Date de début', before: before.startDate, after: after.startDate })
  }
  if (before.endDate.getTime() !== after.endDate.getTime()) {
    dates.push({ label: 'Date de fin', before: before.endDate, after: after.endDate })
  }
  const previousTrainees = before.trainees.map(({ account }) => account.user)
  const currentTrainees = after.trainees.map(({ account }) => account.user)
  const previousEmails = new Set(previousTrainees.map(({ email }) => email))
  const currentEmails = new Set(currentTrainees.map(({ email }) => email))
  const addedTrainees = currentTrainees.filter(({ email }) => !previousEmails.has(email))
  const removedTrainees = previousTrainees.filter(({ email }) => !currentEmails.has(email))
  const professor =
    before.professor?.user.email !== after.professor?.user.email
      ? { before: before.professor?.user ?? null, after: after.professor?.user ?? null }
      : null
  if (!dates.length && !professor && !addedTrainees.length && !removedTrainees.length) {
    return null
  }
  return {
    name: after.name,
    environment: after.environment,
    startDate: after.startDate,
    courseOrganismId: after.courseOrganismId,
    dates,
    professor,
    addedTrainees,
    removedTrainees,
  }
}

const getFTPClient = async () => {
  const client = new Client()
  const accessOptions: AccessOptions = {
    host: process.env.FTP_HOST,
    user: process.env.FTP_USER,
    password: process.env.FTP_PASSWORD,
    port: parseInt(process.env.FTP_PORT || '21', 10),
  }
  await client.access(accessOptions)
  return client
}

const downloadFileFromFTP = async (client: Client, fullPath: string, fileName: string) => {
  const writableStream = fs.createWriteStream(fileName)
  await client.downloadTo(writableStream, fullPath)
  return fs.promises.readFile(fileName)
}

const getRequiredText = (record: Record<string, unknown>, field: string) => {
  const value = record[field]
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`Missing ${field} in training sessions file`)
  }
  return value.trim()
}

const getRequiredDate = (record: Record<string, unknown>, field: string) => {
  const value = record[field]
  const date =
    typeof value === 'number'
      ? getJsDateFromExcel(value)
      : value instanceof Date
        ? value
        : typeof value === 'string'
          ? new Date(value)
          : undefined

  if (!date || Number.isNaN(date.getTime())) {
    throw new Error(`Invalid ${field} in training sessions file`)
  }
  return date
}

const normalizeEmail = (value: unknown) => {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error('Missing email in training sessions file')
  }
  return value.trim().toLowerCase()
}

const getParticipant = (record: Record<string, unknown>, emailField: string): CourseParticipant => ({
  email: normalizeEmail(record[emailField]),
  firstName: getRequiredText(record, 'Prénom'),
  lastName: getRequiredText(record, 'Nom'),
})

const getSession = (sessions: Map<string, CourseSession>, record: Record<string, unknown>) => {
  const name = getRequiredText(record, 'Nom de la session')
  const session = sessions.get(name)
  if (!session) {
    throw new Error(`Unknown training session: ${name}`)
  }
  return session
}

export const parseCourseSessionWorkbook = (data: Buffer, courseOrganismId: string): CourseSession[] => {
  const worksheets = xlsx.parse(data) as Worksheet[]

  const sessions = new Map<string, CourseSession>()
  for (const record of getRecords(worksheets, 'Sessions')) {
    const name = getRequiredText(record, 'Nom de la session')
    const environmentValue = getRequiredText(record, 'Environment').toUpperCase()
    const environment = COURSE_ENVIRONMENT_BY_WORKBOOK_VALUE[environmentValue]
    if (!environment) {
      throw new Error(`Unsupported training environment: ${environmentValue}`)
    }
    if (sessions.has(name)) {
      throw new Error(`Duplicate training session: ${name}`)
    }

    const startDate = getRequiredDate(record, 'Date de début')
    const endDate = getRequiredDate(record, 'Date de fin')
    if (startDate > endDate) {
      throw new Error(`Invalid date range for training session: ${name}`)
    }

    sessions.set(name, {
      courseOrganismId,
      name,
      startDate,
      endDate,
      environment,
      trainees: [],
      professor: null,
    })
  }

  for (const record of getRecords(worksheets, 'Stagiaires')) {
    const session = getSession(sessions, record)
    const trainee = getParticipant(record, 'Stagiaires')
    if (!session.trainees.some(({ email }) => email === trainee.email)) {
      session.trainees.push(trainee)
    }
  }

  const professorsBySession = new Map<string, Set<string>>()
  for (const record of getRecords(worksheets, 'Formateur')) {
    const session = getSession(sessions, record)
    const professor = getParticipant(record, 'Formateur')
    const professors = professorsBySession.get(session.name) ?? new Set<string>()
    professors.add(professor.email)
    professorsBySession.set(session.name, professors)
    session.professor = professor
  }

  for (const session of sessions.values()) {
    const professors = professorsBySession.get(session.name) ?? new Set<string>()
    if (professors.size > 1) {
      throw new Error(`Training session ${session.name} must have exactly one professor`)
    }
    if (session.trainees.some(({ email }) => email === session.professor?.email)) {
      throw new Error(`Professor is also a trainee in training session ${session.name}`)
    }
  }

  return [...sessions.values()]
}

export const getCourseSessionsFromFTP = async (): Promise<CourseSession[]> => {
  let client: Client | undefined
  try {
    const organisms = await prismaClient.courseOrganism.findMany()
    if (organisms.length === 0) {
      return []
    }

    client = await getFTPClient()
    const folderPath = process.env.FTP_TRAINING_SESSIONS_FILE_PATH || '/'
    const fileName = process.env.FTP_TRAINING_SESSIONS_FILE_NAME
    if (!fileName) {
      throw new Error('FTP_TRAINING_SESSIONS_FILE_NAME is not configured')
    }

    const courseSessions: CourseSession[] = []
    for (const organism of organisms) {
      const fullPath = path.posix.join(folderPath, organism.ftpPath, fileName)
      const data = await downloadFileFromFTP(client, fullPath, fileName)
      courseSessions.push(...parseCourseSessionWorkbook(data, organism.id))
    }

    console.log('Training sessions file read successfully')
    return courseSessions
  } catch (error) {
    console.error('Error reading training sessions file:', error)
    throw error
  } finally {
    client?.close()
  }
}

const getAccountId = (
  accounts: {
    id: string
    organizationVersionId: string | null
    environment: Environment
    user: {
      email: string
      firstName: string
      lastName: string
    }
  }[],
  email: string,
  environment: Environment,
) => {
  return accounts.find(
    ({ user, environment: accEnvironment }) => user.email === email && accEnvironment === environment,
  )?.id
}

export const importCourseSessionsFromFTP = async () => {
  const sessions = await getCourseSessionsFromFTP()
  if (sessions.length === 0) {
    return { importedSessions: 0, createdUsers: 0, createdAccounts: 0 }
  }

  const userAccountEntries = []
  for (const session of sessions) {
    for (const participant of session.trainees) {
      userAccountEntries.push({ ...participant, environment: session.environment })
    }
    if (session.professor) {
      userAccountEntries.push({ ...session.professor, environment: session.environment })
    }
  }

  const { newUsers, newAccounts } = await createUsersWithAccount(
    userAccountEntries.map(({ email, firstName, lastName, environment }) => ({
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
  )

  const accounts = await prismaClient.account.findMany({
    where: {
      environment: { in: [...new Set(sessions.map(({ environment }) => environment))] },
      user: { email: { in: userAccountEntries.map(({ email }) => email) } },
    },
    select: {
      id: true,
      environment: true,
      organizationVersionId: true,
      user: { select: { email: true, firstName: true, lastName: true } },
    },
  })
  await prismaClient.$transaction(
    accounts
      .filter(({ organizationVersionId }) => !organizationVersionId)
      .map((account) =>
        prismaClient.account.update({
          where: { id: account.id },
          data: {
            organizationVersion: {
              create: {
                environment: account.environment,
                organization: { create: { name: `${account.user.firstName} ${account.user.lastName}` } },
              },
            },
          },
        }),
      ),
  )

  let traineeCode = randomInt(99999999).toString()
  let professorCode = randomInt(99999999).toString()

  let existingCodes = [{}]
  let count = 0
  while (existingCodes.length > 0 && count < 10) {
    traineeCode = randomInt(99999999).toString()
    professorCode = randomInt(99999999).toString()

    existingCodes = await prismaClient.courseSession.findMany({
      where: { OR: [{ traineeCode }, { professorCode }] },
    })

    count++
  }

  if (count >= 10 && existingCodes.length > 0) {
    throw new Error('Failed to generate unique session codes after 10 attempts')
  }

  const existingSessions = await prismaClient.courseSession.findMany({
    where: {
      OR: sessions.map(({ courseOrganismId, name, environment }) => ({ courseOrganismId, name, environment })),
    },
    select: sessionEmailSelect,
  })

  const importedSessions = await prismaClient.$transaction(
    sessions.map((session) => {
      const professorId = session.professor
        ? getAccountId(accounts, session.professor.email, session.environment)
        : null
      const traineeIds = session.trainees.map(({ email }) => getAccountId(accounts, email, session.environment))

      return prismaClient.courseSession.upsert({
        where: {
          courseOrganismId_name_environment: {
            courseOrganismId: session.courseOrganismId,
            name: session.name,
            environment: session.environment,
          },
        },
        select: sessionEmailSelect,
        create: {
          courseOrganismId: session.courseOrganismId,
          name: session.name,
          environment: session.environment,
          startDate: session.startDate,
          endDate: session.endDate,
          traineeCode,
          professorCode,
          professorId,
          trainees: {
            create: traineeIds.map((accountId) => ({ account: { connect: { id: accountId } } })),
          },
        },
        update: {
          startDate: session.startDate,
          endDate: session.endDate,
          professorId,
          trainees: {
            deleteMany: {},
            create: traineeIds.map((accountId) => ({ account: { connect: { id: accountId } } })),
          },
        },
      })
    }),
  )

  const existingSessionIds = new Set(existingSessions.map(({ id }) => id))
  const previousSessionsById = new Map(existingSessions.map((session) => [session.id, session]))
  const updatedSessions = importedSessions.flatMap((session) => {
    const previous = previousSessionsById.get(session.id)
    const update = previous ? getSessionUpdate(previous, session) : null
    return update ? [update] : []
  })

  const newSessions = importedSessions
    .filter(({ id }) => !existingSessionIds.has(id))
    .map((session) => ({
      ...session,
      trainees: session.trainees.map(({ account }) => account.user),
      professor: session.professor?.user ?? null,
    }))

  if (newSessions.length > 0 || updatedSessions.length > 0) {
    const organisms = await prismaClient.courseOrganism.findMany({
      where: {
        id: { in: [...new Set([...newSessions, ...updatedSessions].map(({ courseOrganismId }) => courseOrganismId))] },
      },
    })

    const emailResults = await Promise.allSettled(
      organisms.map(async (organism) => {
        try {
          await sendCourseSessionsCreatedEmail(
            organism.contactEmail,
            organism.name,
            newSessions.filter(({ courseOrganismId }) => courseOrganismId === organism.id),
            updatedSessions.filter(({ courseOrganismId }) => courseOrganismId === organism.id),
          )
        } catch (error) {
          console.error('Error sending training sessions email:', { courseOrganismId: organism.id }, error)
          throw error
        }
      }),
    )
    const failedEmail = emailResults.find(({ status }) => status === 'rejected')
    if (failedEmail?.status === 'rejected') {
      throw failedEmail.reason
    }
  }

  return { importedSessions: sessions.length, createdUsers: newUsers.count, createdAccounts: newAccounts.count }
}
