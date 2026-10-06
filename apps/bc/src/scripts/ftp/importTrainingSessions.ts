import { prismaClient } from '@/db/client.node'
import { CourseOrganism } from '@abc-transitionbascarbone/db-common'
import { AccessOptions, Client } from 'basic-ftp'
import { getJsDateFromExcel } from 'excel-date-to-js'
import fs from 'fs'
import xlsx from 'node-xlsx'

type Worksheet = {
  name: string
  data: unknown[][]
}

type TrainingSession = Record<string, unknown>

type TrainingSessionWorksheet = Omit<Worksheet, 'data'> & {
  data: TrainingSession[]
}

const IMPORT_FIELD_BY_HEADER: Record<string, string> = {
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

const formatCellValue = (header: string, value: unknown) => {
  if (value === undefined || value === null) {
    return value
  }

  if (header === 'Date début session' || header === 'Date fin session') {
    if (typeof value === 'number') {
      return getJsDateFromExcel(value).toISOString()
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
    data: rows.map((row) =>
      Object.fromEntries(
        headers
          .map((header, index) => {
            const headerName = String(header).trim()
            const fieldName = IMPORT_FIELD_BY_HEADER[headerName]
            return fieldName ? ([fieldName, formatCellValue(headerName, row[index])] as [string, unknown]) : undefined
          })
          .filter((entry): entry is [string, unknown] => entry !== undefined)
          .filter(([, value]) => value !== undefined),
      ),
    ),
  }
}

const handleDataForOF = (of: CourseOrganism, trainingSessions: TrainingSessionWorksheet['data']) => {
  const organizationVersionToCreate = trainingSessions.map((session) => ({
    startDate: session.formationStartDate,
    endDate: session.formationEndDate,
    courseOrganismId: of.id,
    environment: session.environment,
  }))

  const courseSessionToCreate = trainingSessions.map((session) => ({
    startDate: session.formationStartDate,
    endDate: session.formationEndDate,
    courseOrganismId: of.id,
  }))
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
      handleDataForOF(of, trainingSessions)
    }

    console.log('Training sessions file read successfully')
  } catch (error) {
    console.error('Error reading training sessions file:', error)
    throw error
  } finally {
    client?.close()
  }
}
