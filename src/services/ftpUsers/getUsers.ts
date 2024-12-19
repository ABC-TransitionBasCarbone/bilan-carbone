import { PrismaClient, Role } from '@prisma/client'
import { AccessOptions, Client } from 'basic-ftp'
import { Writable } from 'stream'

const prisma = new PrismaClient()

class MyWritableStream extends Writable {
  private data: string = ''

  _write(chunk: any, encoding: string, callback: Function) {
    this.data += chunk.toString()
    callback()
    return encoding
  }

  getData() {
    return this.data
  }
}

export const getUsersFromFTP = async () => {
  const client = new Client()
  client.ftp.verbose = true

  try {
    const accessOptions = {
      host: process.env.NEXT_FTP_HOST,
      user: process.env.NEXT_FTP_USER,
      password: process.env.NEXT_FTP_PASSWORD,
      secureOptions: { rejectUnauthorized: false },
      port: parseInt(process.env.NEXT_FTP_PORT || '22', 10),
      protocol: 'ftp',
      secure: true,
    } as AccessOptions

    await client.access(accessOptions)

    // Fetch the file from the FTP server
    const fileName = process.env.NEXT_FTP_FILE_NAME || ''

    const stream = new MyWritableStream()

    await client.downloadTo(stream, '/abc-transitionbascarbone.scienceontheweb.net/' + fileName)

    // Convert the stream to a string (assuming it's a text file)
    const data = stream.getData()

    // Insert data into PostgreSQL using Prisma
    const values = data
      .split('\n')
      .map((line) => line.split(','))
      .filter((data) => data.length > 1) // Adjust based on your file format
    values.shift()

    for (const value of values) {
      await prisma.user.create({
        data: {
          email: value[0],
          role: Role.DEFAULT,
          firstName: value[0],
          lastName: value[0],
          isActive: false,
        },
      })
    }
  } catch (e) {
    console.error(e)
  }
}
