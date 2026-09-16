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
  'Date début session': 'formationStartDate',
  'Date fin session': 'formationEndDate',
  Organisation: 'companyName',
  'Nom de Formation': 'formationName',
  Nom: 'lastName',
  Prenom: 'firstName',
  'E-mail': 'userEmail',
  'Produits achetés': 'purchasedProducts',
  'Code session': 'sessionCode',
  SIRET: 'siret',
  'Numero Fiscal': 'taxNumber',
  TVA: 'vat',
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

const downloadFileFromFTP = async (client: Client, folderPath: string, fileName: string) => {
  const fullPath = `${folderPath}${fileName}`
  const writableStream = fs.createWriteStream(fileName)
  await client.downloadTo(writableStream, fullPath)
  return fs.promises.readFile(fileName)
}

const formatCellValue = (header: string, value: unknown) => {
  if (value === undefined || value === null) {
    return value
  }

  if (header === 'Date début session' || header === 'Date fin session') {
    if (typeof value === 'number') {
      return getJsDateFromExcel(value).toISOString().slice(0, 10)
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
            const headerName = String(header)
            const fieldName = IMPORT_FIELD_BY_HEADER[headerName]
            return fieldName ? ([fieldName, formatCellValue(headerName, row[index])] as [string, unknown]) : undefined
          })
          .filter((entry): entry is [string, unknown] => entry !== undefined)
          .filter(([, value]) => value !== undefined),
      ),
    ),
  }
}

export const getTrainingSessionsFromFTP = async (): Promise<TrainingSession[]> => {
  let client: Client | undefined
  try {
    client = await getFTPClient()
    const folderPath = process.env.FTP_TRAINING_SESSIONS_FILE_PATH || '/'
    const fileName = process.env.FTP_TRAINING_SESSIONS_FILE_NAME || '/'
    const data = await downloadFileFromFTP(client, folderPath, fileName)

    const trainingSessions = xlsx
      .parse(data)
      .filter((worksheet) => worksheet.name !== 'Liste')
      .map(convertWorksheetRowsToObjects)
      .flatMap((worksheet) => worksheet.data)
    console.log(trainingSessions)
    console.log('Training sessions file read successfully')
    return trainingSessions
  } catch (error) {
    console.error('Error reading training sessions file:', error)
    throw error
  } finally {
    client?.close()
  }
}
