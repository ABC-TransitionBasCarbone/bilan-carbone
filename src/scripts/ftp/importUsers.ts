import { Prisma, Role } from '@prisma/client'
import { AccessOptions, Client } from 'basic-ftp'
import { parse } from 'csv-parse'
import dotenv from 'dotenv'
import { prismaClient } from '../../db/client'

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

  const users: Prisma.UserCreateManyInput[] = []
  const parseStream = parse({ delimiter: ';', columns: true, bom: true })
    .on('data', async (value) => {
      if (users.length % 10 === 0) {
        console.log(`Processed ${users.length} lines...`)
      }
      const email = value['User Email']

      const siretValue = value['SIRET']
      const SIRET = /^\d{14}$/
      let organizationId = null

      if (siretValue && SIRET.test(siretValue)) {
        const result = await prismaClient.organization.findFirst({
          where: { siret: siretValue },
        }).catch((err) => {
        })
        if (result) {
          organizationId = result.id
        }
      }

      users.push({
        email,
        role: Role.DEFAULT,
        firstName: email,
        lastName: email,
        isActive: false,
        isValidated: false,
        organizationId: organizationId
      })
    })
    .on('end', async () => {
      console.log('Parsing complete, saving users to database...')
      await prismaClient.user.createMany({ data: users, skipDuplicates: true })
      console.log(`Done! ${users.length} users imported.`)
      client.close()
    })
    .on('error', (err) => {
      console.error('Error during parsing:', err)
      client.close()
    })

  console.log('Downloading file...')
  await client.downloadTo(parseStream, fileName)
  client.close()
}

dotenv.config()
getUsersFromFTP()
