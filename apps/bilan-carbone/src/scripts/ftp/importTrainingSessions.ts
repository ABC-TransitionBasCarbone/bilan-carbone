import { AccessOptions, Client } from 'basic-ftp'
import fs from 'fs'
import xlsx from 'node-xlsx'

type Worksheet = {
  name: string
  data: unknown[][]
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

const convertWorksheetRowsToObjects = (worksheet: Worksheet) => {
  const [headers, ...rows] = worksheet.data

  if (!headers) {
    return worksheet
  }

  return {
    ...worksheet,
    data: rows.map((row) =>
      Object.fromEntries(
        headers
          .map((header, index) => [String(header), row[index]] as const)
          .filter(([, value]) => value !== undefined),
      ),
    ),
  }
}

export const getTrainingSessionsFromFTP = async () => {
  let client: Client | undefined
  try {
    client = await getFTPClient()
    const folderPath = process.env.FTP_TRAINING_SESSIONS_FILE_PATH || '/'
    const fileName = process.env.FTP_TRAINING_SESSIONS_FILE_NAME || '/'
    const data = await downloadFileFromFTP(client, folderPath, fileName)

    const worksheets = xlsx.parse(data).map(convertWorksheetRowsToObjects)
    console.log(worksheets)
    console.log('Training sessions file read successfully')
    return worksheets
  } catch (error) {
    console.error('Error reading training sessions file:', error)
    throw error
  } finally {
    client?.close()
  }
}
