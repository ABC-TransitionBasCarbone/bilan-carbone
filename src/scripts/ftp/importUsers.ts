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

  const folderPath = process.env.FTP_FILE_PATH || '/'
  const fileName = process.env.FTP_FILE_NAME || '/'
  const fullPath = `${folderPath + fileName}`

  const fileList = await client.list(folderPath)
  const file = fileList.find((f) => f.name === fileName)
  const importedFileDate = new Date(file?.rawModifiedAt || Date.now())

  const writableStream = fs.createWriteStream(fileName)

  await client.downloadTo(writableStream, fullPath)

  const data = await fs.promises.readFile(fileName, 'utf-8')
  const values = JSON.parse(data)
  console.log(`Users parsed : ${values.length} rows`)
  client.close()

  const users: Prisma.UserCreateManyInput[] = []
  for (let i = 0; i < values.length; i++) {
    const value = values[i]
    const email = value['User_Email']
    const firstName = value['Firstname'] || ''
    const lastName = value['Lastname'] || ''
    const siretOrSiren = value['SIRET']
    const sessionCodeTraining = value['Session_Code']
    const name = value['Company_Name']

    const purchasedProducts = value['Purchased_Products']
    const isCR = ['adhérent_conseil', 'licence_exploitation'].includes(purchasedProducts)

    const membershipYear = value['Membership_Year']
    const currentYear = new Date().getFullYear()
    const activatedLicence = membershipYear && !membershipYear.includes(currentYear)

    if (i % 50 === 0) {
      console.log(`${i}/${values.length}`)
    }

    const dbUser = (await prismaClient.user.findUnique({
      where: { email },
    })) as Prisma.UserCreateManyInput

    const user: Prisma.UserCreateManyInput = {
      id: dbUser?.id,
      email,
      firstName,
      lastName,
      role: Role.GESTIONNAIRE,
      isActive: false,
      isValidated: false,
      importedFileDate,
    }

    if (sessionCodeTraining) {
      user.level = sessionCodeTraining.includes('BCM2') ? Level.Advanced : Level.Initial
      user.role = Role.ADMIN
    }

    if (siretOrSiren) {
      let organisation = await prismaClient.organization.findFirst({
        where: { siret: { startsWith: siretOrSiren } },
      })
      if (!organisation) {
        organisation = await prismaClient.organization.create({
          data: {
            siret: siretOrSiren,
            name,
            isCR,
            importedFileDate,
            activatedLicence,
          },
        })
      }
      user.organizationId = organisation.id
    }

    if (dbUser) {
      prismaClient.user.update({
        where: { id: dbUser.id },
        data: user,
      })
      if (dbUser.organizationId) {
        prismaClient.organization.update({
          where: { id: dbUser.organizationId },
          data: { name, isCR },
        })
      }
      console.log(`Updating ${email} because already exists`)
      continue
    }
    users.push(user)
  }

  const created = await prismaClient.user.createMany({
    data: users,
    skipDuplicates: true,
  })

  console.log(`${created.count} users created`)
}

dotenv.config()
getUsersFromFTP()
