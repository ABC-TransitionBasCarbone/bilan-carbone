import { AccessOptions, Client } from 'basic-ftp'
import dotenv from 'dotenv'
import fs from 'fs'
import { Writable } from 'stream'



export const getUsersFromFTP = async () => {
  const client = new Client()

  const accessOptions = {
    host: process.env.FTP_HOST,
    user: process.env.FTP_USER,
    password: process.env.FTP_PASSWORD,
    port: parseInt(process.env.FTP_PORT || '21', 10),
  } satisfies AccessOptions

  await client.access(accessOptions)

  const fileName = process.env.FTP_FILE_NAME || ''

  const writableStream = fs.createWriteStream(fileName)

  const test = await client.downloadTo(writableStream, fileName)

  writableStream.on("data", (chunk) => {
    console.log("chunk : ", chunk)
    console.log(`Received ${chunk.length} bytes of data.`)
  })

  writableStream.on('end', () => {
    console.log('No more data.');
  });

  client.close()
}

dotenv.config()
getUsersFromFTP()
