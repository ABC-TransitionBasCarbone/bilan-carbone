import { prismaClient } from '@/db/client.node'
import { CourseOrganism } from '@abc-transitionbascarbone/db-common'
import { Environment, Role, UserStatus } from '@abc-transitionbascarbone/db-common/enums'
import { AccessOptions, Client } from 'basic-ftp'
import { randomInt } from 'crypto'
import { getJsDateFromExcel } from 'excel-date-to-js'
import fs from 'fs'
import xlsx from 'node-xlsx'
import { z } from 'zod'

type Worksheet = {
  name: string
  data: unknown[][]
}

type TrainingSession = {
  sessionId: string
  formationStartDate: Date
  formationEndDate: Date
  environment: string
  userEmails?: string | null
}

type CellValue = undefined | null | Date | string

type TrainingSessionRow = Partial<Record<keyof TrainingSession, CellValue>>

type TrainingSessionWorksheet = Omit<Worksheet, 'data'> & {
  data: TrainingSessionRow[]
}

const IMPORT_FIELD_BY_HEADER: Partial<Record<string, keyof TrainingSessionRow>> = {
  'Nom de la session': 'sessionId',
  'Date de début': 'formationStartDate',
  'Date de fin': 'formationEndDate',
  Stagiaires: 'userEmails',
  Environment: 'environment',
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

const downloadFileFromFTP = async (client: Client, of: CourseOrganism) => {
  try {
    const folderPath = process.env.FTP_TRAINING_SESSIONS_FILE_PATH || '/'
    const fileName = process.env.FTP_TRAINING_SESSIONS_FILE_NAME || '/'

    const { ftpPath } = of

    const fullPath = `${folderPath}/${ftpPath}/${fileName}`
    const writableStream = fs.createWriteStream(fileName)
    await client.downloadTo(writableStream, fullPath)
    return fs.promises.readFile(fileName)
  } catch (e) {
    console.error('Failed to download file from FTP for an orga:', of.name, e)
    return null
  }
}

const formatCellValue = (header: string, value: unknown): CellValue => {
  if (value === undefined || value === null) {
    return value
  }

  if (header === 'Date de début' || header === 'Date de fin') {
    if (typeof value === 'number') {
      return getJsDateFromExcel(value)
    }
    if (value instanceof Date) {
      return value
    }
    if (typeof value === 'string') {
      return value.trim() ? new Date(value) : value
    }
  }

  return typeof value === 'string' ? value : String(value)
}

const convertWorksheetRowsToObjects = (worksheet: Worksheet): TrainingSessionWorksheet => {
  const [headers, ...rows] = worksheet.data

  if (!headers) {
    return { ...worksheet, data: [] }
  }

  return {
    ...worksheet,
    data: rows.map((row) => {
      const session: TrainingSessionRow = {}
      for (const [index, header] of headers.entries()) {
        const headerName = String(header).trim()
        const fieldName = IMPORT_FIELD_BY_HEADER[headerName]
        if (fieldName) {
          session[fieldName] = formatCellValue(headerName, row[index])
        }
      }
      return session
    }),
  }
}

const isValidDate = (value: CellValue): value is Date => value instanceof Date && !Number.isNaN(value.getTime())

const isTrainingSession = (session: TrainingSessionRow): session is TrainingSession => {
  return (
    typeof session.sessionId === 'string' &&
    isValidDate(session.formationStartDate) &&
    isValidDate(session.formationEndDate) &&
    typeof session.environment === 'string' &&
    (session.userEmails === null || typeof session.userEmails === 'string')
  )
}

const parseTrainingSession = (session: TrainingSessionRow) => {
  const name = typeof session.sessionId === 'string' ? session.sessionId.trim() : ''
  if (!isTrainingSession(session)) {
    throw new Error(`Invalid training session: ${name || '(missing name)'}`)
  }

  const startDate = session.formationStartDate
  const endDate = session.formationEndDate
  const importedEnvironment = session.environment.trim().toUpperCase()
  const environment =
    importedEnvironment === Environment.BC || importedEnvironment === Environment.COURSE_BC
      ? Environment.COURSE_BC
      : importedEnvironment === Environment.TILT || importedEnvironment === Environment.COURSE_TILT
        ? Environment.COURSE_TILT
        : undefined

  if (!name || !environment || endDate < startDate) {
    throw new Error(`Invalid training session: ${name || '(missing name)'}`)
  }

  const userEmails = [
    ...new Set(
      (session.userEmails ?? '')
        .split(/[;,\s]+/)
        .filter(Boolean)
        .filter((email) => {
          if (!z.email().safeParse(email).success) {
            console.error('incorrect email for of training session:', name)
            return false
          }

          return true
        })
        .map((email) => email.toLowerCase()),
    ),
  ]

  return { name, startDate, endDate, environment, userEmails }
}

const handleDataForOF = async (of: CourseOrganism, trainingSessions: TrainingSessionWorksheet['data']) => {
  const sessions = trainingSessions
    .filter((session) => Object.values(session).some((value) => value != null && String(value).trim() !== ''))
    .map(parseTrainingSession)

  for (const { name, startDate, endDate, environment, userEmails } of sessions) {
    const existingSession = await prismaClient.courseSession.findFirst({
      where: {
        courseOrganismId: of.id,
        organizationVersion: { environment, organization: { name } },
      },
      select: { id: true },
    })

    const courseSession = existingSession
      ? await prismaClient.courseSession.update({
          where: { id: existingSession.id },
          data: { startDate, endDate },
        })
      : await prismaClient.courseSession.create({
          data: {
            startDate,
            endDate,
            courseOrganism: { connect: { id: of.id } },
            organizationVersion: {
              create: {
                environment,
                organization: { create: { name } },
              },
            },
            sessionCode: {
              create: {
                traineeCode: randomInt(99999999).toString(),
                professorCode: randomInt(99999999).toString(),
              },
            },
          },
        })

    if (userEmails.length === 0) {
      continue
    }

    const { organizationVersionId } = courseSession
    if (!organizationVersionId) {
      throw new Error(`Missing organization version for training session: ${name}`)
    }

    for (const email of userEmails) {
      const user = await prismaClient.user.upsert({
        where: { email },
        create: { email, firstName: '', lastName: '' },
        update: {},
        select: { id: true },
      })
      await prismaClient.account.upsert({
        where: { userId_environment: { userId: user.id, environment } },
        create: {
          organizationVersionId,
          userId: user.id,
          environment,
          role: Role.COLLABORATOR,
          status: UserStatus.IMPORTED,
        },
        update: {},
      })
    }
  }
}

export const getTrainingSessionsFromFTP = async () => {
  let client: Client | undefined
  try {
    client = await getFTPClient()

    const ofList = await prismaClient.courseOrganism.findMany({})

    if (!ofList || !ofList.length) {
      throw new Error('No course organisms found')
    }

    for (const of of ofList) {
      const data = await downloadFileFromFTP(client, of)

      if (!data) {
        continue
      }

      const trainingSessions = xlsx
        .parse(data)
        .filter((worksheet) => worksheet.name !== 'Liste')
        .map(convertWorksheetRowsToObjects)
        .flatMap((worksheet) => worksheet.data)

      console.log(trainingSessions.length, 'training sessions found for', of.name)
      await handleDataForOF(of, trainingSessions)
    }

    console.log('Training sessions file read successfully')
  } catch (error) {
    console.error('Error reading training sessions file:', error)
    throw error
  } finally {
    client?.close()
  }
}
