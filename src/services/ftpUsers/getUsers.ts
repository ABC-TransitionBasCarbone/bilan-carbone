import { PrismaClient, Role } from '@prisma/client'
import { AccessOptions, Client } from "basic-ftp"
import { Writable } from 'stream'

const prisma = new PrismaClient()

export const getUsersFromFTP = async () => {
  const client = new Client()
  client.ftp.verbose = true

  try {
    const accessOptions = {
      host: process.env.NEXT_FTP_HOST,
      user: process.env.NEXT_FTP_USER,
      password: process.env.NEXT_FTP_PASSWORD,
      port: parseInt(process.env.NEXT_FTP_PORT || '22', 10),
      protocol: 'ftp',
      name: "4486812@abc-transitionbascarbone.scienceontheweb.net",
      uploadOnSave: false,
      useTempFile: false,
      openSsh: false
    } as AccessOptions
    console.log("🚀 ~ getUsersFromFTP ~ accessOptions:", accessOptions)

    await client.access(accessOptions)

    // Connect to the SFTP server
    // await sftp.connect(accessOptions)

    // Fetch the file from the SFTP server
    const fileName = process.env.NEXT_FTP_FILE_NAME || ''
    console.log('🚀 ~ getUsersFromFTP ~ fileName:', fileName)
    const stream = new Writable()


    console.log("🚀 ~ getUsersFromFTP ~ await client.list():", await client.list())

    // await sftp.get(fileName, stream)
    const test = await client.downloadTo(stream, "/abc-transitionbascarbone.scienceontheweb.net/" + fileName)
    console.log("🚀 ~ getUsersFromFTP ~ test:", test)
    console.log("🚀 ~ getUsersFromFTP ~ stream:", stream)


    // Convert the stream to a string (assuming it's a text file)
    const data = stream.toString()
    console.log("🚀 ~ getUsersFromFTP ~ data:", data)

    // Insert data into PostgreSQL using Prisma
    const values = data.split('\n').map((line) => line.split(',')) // Adjust based on your file format
    for (const value of values) {
      await prisma.user.create({
        data: {
          email: value[0],
          role: Role.DEFAULT,
          firstName: value[1],
          lastName: value[2],
          isActive: false
        },
      })
    }
  } catch (err) {
    console.error('Error:', err)
  } finally {
    await prisma.$disconnect()
  }
}
