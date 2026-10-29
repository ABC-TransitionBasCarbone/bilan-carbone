import { Client } from 'basic-ftp'
import { processUsers } from './userImport'
import { downloadFileFromFTPUTF8, getFTPClient } from './utils'

export const getUsersFromFTP = async () => {
  let client: Client | undefined
  try {
    client = await getFTPClient()
    const folderPath = process.env.FTP_FILE_PATH || '/'
    const fileName = process.env.FTP_FILE_NAME || '/'
    const fileList = await client.list(folderPath)
    const file = fileList.find((f) => f.name === fileName)
    const importedFileDate = new Date(file?.rawModifiedAt || Date.now())

    const fullPath = `${folderPath}${fileName}`
    const data = await downloadFileFromFTPUTF8(client, fullPath, fileName)
    const values = JSON.parse(data)

    await processUsers(values, importedFileDate)
  } catch (error) {
    console.error('Error importing users:', error)
    throw error
  } finally {
    client?.close()
  }
}
