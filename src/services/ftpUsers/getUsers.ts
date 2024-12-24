import { prismaClient } from '@/db/client'
import { Role } from '@prisma/client'
import { AccessOptions, Client } from 'basic-ftp'
import { PassThrough } from 'stream'

export const getUsersFromFTP = async () => {
  const client = new Client()

  try {
    const accessOptions = {
      host: process.env.NEXT_FTP_HOST,
      user: process.env.NEXT_FTP_USER,
      password: process.env.NEXT_FTP_PASSWORD,
      secureOptions: { rejectUnauthorized: false },
      port: parseInt(process.env.NEXT_FTP_PORT || '21', 10),
      protocol: 'ftp',
      secure: true,
    } as AccessOptions

    await client.access(accessOptions)

    // Fetch the file from the FTP server
    const fileName = process.env.NEXT_FTP_FILE_NAME || ''

    const passThrough = new PassThrough()
    let data = ''

    passThrough.on('data', (chunk) => {
      data += chunk.toString()
    })

    passThrough.on('end', async () => {
      // Insert data into PostgreSQL using Prisma
      const users = data
        .split('\n')
        .map((line) => line.split(','))
        .filter((data) => data.length > 1) // Adjust based on your file format
      users.shift()

      await prismaClient.user.createMany({
        data: users.map((value) => ({
          email: value[0],
          role: Role.DEFAULT,
          firstName: value[0],
          lastName: value[0],
          isActive: false,
          isValidate: false,
        })),
      })
    })

    await client.downloadTo(passThrough, fileName)
  } catch (e) {
    console.error(e)
  }
}
