import { AccessOptions, Client } from 'basic-ftp'
import dotenv from 'dotenv'
import fs from 'fs'
import { processUsers } from '../../services/serverFunctions/user'

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

const getUsersFromFTP = async () => {
  try {
    const client = await getFTPClient()
    const folderPath = process.env.FTP_FILE_PATH || '/'
    const fileName = process.env.FTP_FILE_NAME || '/'
    const fileList = await client.list(folderPath)
    const file = fileList.find((f) => f.name === fileName)
    const importedFileDate = new Date(file?.rawModifiedAt || Date.now())

    const data = await downloadFileFromFTP(client, folderPath, fileName)
    const values = JSON.parse(data)
    client.close()

    await processUsers(values, importedFileDate)
  } catch (error) {
    console.error('Error importing users:', error)
  }
}

dotenv.config()
getUsersFromFTP()
