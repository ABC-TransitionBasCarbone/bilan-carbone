import { prismaClient } from '@/db/client.node'
import { CourseOrganism } from '@abc-transitionbascarbone/db-common'
import { Environment } from '@abc-transitionbascarbone/db-common/enums'
import { AccessOptions, Client } from 'basic-ftp'
import { randomUUID } from 'crypto'
import { getJsDateFromExcel } from 'excel-date-to-js'
import fs from 'fs'
import xlsx from 'node-xlsx'

type Worksheet = {
  name: string
  data: unknown[][]
}

type TrainingSession = {
  sessionId: string
  formationStartDate: Date
  formationEndDate: Date
  environment: string
}

type CellValue = undefined | null | Date | string

type TrainingSessionRow = Partial<Record<keyof TrainingSession | 'userEmails', CellValue>>

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
  console.log('heeeere')
  console.log(session.environment, typeof session.environment === 'string')
  return (
    typeof session.sessionId === 'string' &&
    isValidDate(session.formationStartDate) &&
    isValidDate(session.formationEndDate) &&
    typeof session.environment === 'string'
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

  return { name, startDate, endDate, environment }
}

const handleDataForOF = async (of: CourseOrganism, trainingSessions: TrainingSessionWorksheet['data']) => {
  const sessions = trainingSessions
    .filter((session) => Object.values(session).some((value) => value != null && String(value).trim() !== ''))
    .map(parseTrainingSession)

  for (const { name, startDate, endDate, environment } of sessions) {
    const existingSession = await prismaClient.courseSession.findFirst({
      where: {
        courseOrganismId: of.id,
        organizationVersion: { environment, organization: { name } },
      },
      select: { id: true },
    })

    if (existingSession) {
      await prismaClient.courseSession.update({
        where: { id: existingSession.id },
        data: { startDate, endDate },
      })
      continue
    }

    const test = await prismaClient.courseSession.create({
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
            traineeCode: randomUUID(),
            professorCode: randomUUID(),
          },
        },
      },
    })

    console.log(test)
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
