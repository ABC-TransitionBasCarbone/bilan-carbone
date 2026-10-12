import { prismaClient } from '@/db/client.server'
import { createUsersWithAccount } from '@/db/user'
import { Environment, Role, UserSource, UserStatus } from '@abc-transitionbascarbone/common/db/enums'
import { AccessOptions, Client } from 'basic-ftp'
import { randomInt } from 'crypto'
import { getJsDateFromExcel } from 'excel-date-to-js'
import fs from 'fs'
import xlsx from 'node-xlsx'
import path from 'path'

type Worksheet = {
  name: string
  data: unknown[][]
}

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

const getWorksheetRecords = (worksheet: Worksheet): Record<string, unknown>[] => {
  const [headers, ...rows] = worksheet.data
  if (!headers) {
    return []
  }

  const headerIndexes = new Map(headers.map((header, index) => [String(header).trim(), index]))
  return rows.map((row) => Object.fromEntries([...headerIndexes].map(([header, index]) => [header, row[index]])))
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

const getRecords = (worksheets: Worksheet[], name: string) => {
  const worksheet = worksheets.find((item) => item.name.trim() === name)
  if (!worksheet) {
    throw new Error(`Missing ${name} sheet in training sessions file`)
  }
  return getWorksheetRecords(worksheet)
}

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
    if (professors.size !== 1) {
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
const getAccountId = (accountIds: Map<string, string>, email: string, environment: Environment) => {
  const id = accountIds.get(`${environment}:${email}`)
  if (!id) {
    throw new Error(`Could not find account for ${email} in ${environment}`)
  }
  return id
}
export const importCourseSessionsFromFTP = async () => {
  const sessions = await getCourseSessionsFromFTP()
  if (sessions.length === 0) {
    return { importedSessions: 0, createdUsers: 0, createdAccounts: 0 }
  }

  const usersByEmailAndEnvironment = new Map<string, CourseParticipant & { environment: Environment }>()
  for (const session of sessions) {
    for (const participant of [...session.trainees, session.professor!]) {
      const key = `${session.environment}:${participant.email}`
      const existingParticipant = usersByEmailAndEnvironment.get(key)
      if (
        existingParticipant &&
        (existingParticipant.firstName !== participant.firstName ||
          existingParticipant.lastName !== participant.lastName)
      ) {
        throw new Error(`Conflicting name for ${participant.email} in training sessions file`)
      }
      usersByEmailAndEnvironment.set(key, { ...participant, environment: session.environment })
    }
  }

  const userAccountEntries = [...usersByEmailAndEnvironment.values()]
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
  const accountIds = new Map(accounts.map((account) => [`${account.environment}:${account.user.email}`, account.id]))

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

  await prismaClient.$transaction(
    sessions.map((session) => {
      const professorId = getAccountId(accountIds, session.professor!.email, session.environment)
      const traineeIds = session.trainees.map(({ email }) => getAccountId(accountIds, email, session.environment))
      return prismaClient.courseSession.upsert({
        where: {
          courseOrganismId_name_environment: {
            courseOrganismId: session.courseOrganismId,
            name: session.name,
            environment: session.environment,
          },
        },
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

  return { importedSessions: sessions.length, createdUsers: newUsers.count, createdAccounts: newAccounts.count }
}
