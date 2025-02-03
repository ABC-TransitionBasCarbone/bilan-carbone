import { AccessOptions, Client } from 'basic-ftp'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

export const getUsersFromFTP = async () => {
  const client = new Client()
  client.ftp.verbose = true

  const accessOptions = {
    host: process.env.FTP_HOST,
    user: process.env.FTP_USER,
    password: process.env.FTP_PASSWORD,
    port: parseInt(process.env.FTP_PORT || '21', 10),
  } satisfies AccessOptions

  await client.access(accessOptions)

  const fileName = process.env.FTP_FILE_NAME || ''
  const filePath = process.env.FTP_FILE_PATH || ''
  const fullPath = path.join(filePath, fileName)

  // Validate file name
  const invalidChars = /[<>:"/\\|?*\x00-\x1F]/g
  if (invalidChars.test(fileName)) {
    console.error(`File name ${fileName} contains invalid characters`)
    client.close()
    return
  }


  console.log(await client.list())

  // Check if the file exists and is a regular file
  const fileList = await client.list(filePath)
  const file = fileList.find(f => f.name === fileName)
  if (!file) {
    console.error(`File ${fileName} does not exist at path ${filePath}`)
    client.close()
    return
  }
  if (file.type === 0) {
    console.error(`File ${fileName} is not a regular file`)
    client.close()
    return
  }
  const writableStream = fs.createWriteStream(file.name)

  await client.uploadFrom("README.md", "README_FTP.md")

  await client.downloadTo("C:/Users/RomainCABC/Documents/git/bcplus2/bilan-carbone/src/scripts/ftp/" + fileName, fullPath)
  // const test = await client.downloadTo(writableStream, "README_FTP.md")
  // console.log(test)
  client.close()
}

dotenv.config()
getUsersFromFTP()
