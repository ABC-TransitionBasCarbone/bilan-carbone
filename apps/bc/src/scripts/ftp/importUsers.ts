import { AccessOptions, Client } from 'basic-ftp'
import fs from 'fs'
import { processUsers } from './userImport'

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
  return fs.promises.readFile(fileName, 'utf-8')
}

export const getUsersFromFTP = async () => {
  let client: Client | undefined
  try {
    client = await getFTPClient()
    const folderPath = process.env.FTP_FILE_PATH || '/'
    const fileName = process.env.FTP_FILE_NAME || '/'
    const fileList = await client.list(folderPath)
    const file = fileList.find((f) => f.name === fileName)
    const importedFileDate = new Date(file?.rawModifiedAt || Date.now())

    const data = await downloadFileFromFTP(client, folderPath, fileName)
    const values = JSON.parse(data)

    await processUsers(values, importedFileDate)
  } catch (error) {
    console.error('Error importing users:', error)
    throw error
  } finally {
    client?.close()
  }
}
