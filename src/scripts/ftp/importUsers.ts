import { Level, Prisma, Role } from '@prisma/client'
import { AccessOptions, Client } from 'basic-ftp'
import dotenv from 'dotenv'
import fs from 'fs'
import { prismaClient } from '../../db/client'

const getUsersFromFTP = async () => {
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

  await client.downloadTo(writableStream, fileName)
  const fileList = await client.list()
  const file = fileList.find((f) => f.name === fileName)
  const fileDate = new Date(file?.rawModifiedAt || Date.now())
  client.close()

  const data = await fs.promises.readFile(fileName, 'utf-8')
  const values = JSON.parse(data)
  console.log(`Users parsed : ${values.length} rows`)

  const users: Prisma.UserCreateManyInput[] = []
  for (const [i, value] of values) {
    if (i % 50 === 0) {
      console.log(`${i}/${values.length}`)
    }
    const login = value['User_Login']
    const email = value['User_Email']
    const siretOrSiren = value['SIRET']
    const sessionCodeTraining = value['Session_Code']
    const user: Prisma.UserCreateManyInput = {
      email,
      role: Role.DEFAULT,
      firstName: login,
      lastName: '',
      isActive: false,
      isValidated: false,
      createdAt: fileDate,
      level: Level.Initial
    }

    if (sessionCodeTraining) {
      user.level = sessionCodeTraining.includes('BCM2') ? Level.Advanced : Level.Standard
    }

    if (siretOrSiren) {
      let organisation = await prismaClient.organization.findFirst({
        where: { siret: { startsWith: siretOrSiren } },
      })
      if (!organisation) {
        const name = value['Company_Name']
        const purchasedProducts = value['Purchased_Products']

        organisation = await prismaClient.organization.create({
          data: {
            siret: siretOrSiren,
            name,
            isCR: purchasedProducts.includes('conseil'), // TODO: check if licence exploitation is CR
            createdAt: fileDate,
          },
        })

        user.role = Role.GESTIONNAIRE
      }
      user.organizationId = organisation.id
    }
    users.push(user)
  }

  const created = await prismaClient.user.createMany({ data: users, skipDuplicates: true })
  console.log(`${created} users created.`)
}

dotenv.config()
getUsersFromFTP()
