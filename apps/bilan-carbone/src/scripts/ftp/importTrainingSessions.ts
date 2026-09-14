import { AccessOptions, Client } from 'basic-ftp'
import fs from 'fs'
import xlsx from 'node-xlsx'

const TRAINING_ORGANIZATIONS = new Set(['IFC', 'Nepsen', 'Net Positive Academy', 'Sami Academy', 'take[air]'])

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

export const getTrainingSessionsFromFTP = async () => {
  let client: Client | undefined
  try {
    client = await getFTPClient()
    const folderPath = process.env.FTP_TRAINING_SESSIONS_FILE_PATH || '/'
    const fileName = process.env.FTP_TRAINING_SESSIONS_FILE_NAME || '/'
    const data = await downloadFileFromFTP(client, folderPath, fileName)

    const worksheets = xlsx.parse(data)
    const filteredWorksheets = worksheets.map((worksheet) => {
      if (worksheet.name !== 'A REMPLIR' || worksheet.data.length === 0) {
        return worksheet
      }

      const [headers, ...rows] = worksheet.data
      const organizationIndex = headers.findIndex((header) => header === 'Organisme de formation')
      if (organizationIndex === -1) {
        return worksheet
      }

      return {
        ...worksheet,
        data: [
          headers,
          ...rows.filter((row) => {
            const organization = row[organizationIndex]
            return typeof organization === 'string' && TRAINING_ORGANIZATIONS.has(organization.trim())
          }),
        ],
      }
    })
    const firstRows = filteredWorksheets.map((worksheet) => ({ ...worksheet, data: worksheet.data.slice(0, 3) }))
    console.log(firstRows)
    console.log('Training sessions file read successfully')
    return firstRows
  } catch (error) {
    console.error('Error reading training sessions file:', error)
    throw error
  } finally {
    client?.close()
  }
}
