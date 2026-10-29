import { AccessOptions, Client } from 'basic-ftp'
import fs from 'fs'
export const getFTPClient = async () => {
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

export const downloadFileFromFTP = async (client: Client, fullPath: string, fileName: string) => {
  const writableStream = fs.createWriteStream(fileName)
  await client.downloadTo(writableStream, fullPath)
  return fs.promises.readFile(fileName)
}

export const downloadFileFromFTPUTF8 = async (client: Client, fullPath: string, fileName: string) => {
  const writableStream = fs.createWriteStream(fileName)
  await client.downloadTo(writableStream, fullPath)
  return fs.promises.readFile(fileName, 'utf-8')
}
