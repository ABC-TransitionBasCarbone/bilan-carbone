import { Level, Prisma, Role, UserStatus } from '@prisma/client'
import { AccessOptions, Client } from 'basic-ftp'
import dotenv from 'dotenv'
import fs from 'fs'
import { prismaClient } from '../../db/client'

const getFTPClient = async () => {
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

const downloadFileFromFTP = async (client: Client, folderPath: string, fileName: string) => {
  const fullPath = `${folderPath}${fileName}`
  const writableStream = fs.createWriteStream(fileName)
  await client.downloadTo(writableStream, fullPath)
  return fs.promises.readFile(fileName, 'utf-8')
}

const parseUsers = (data: string) => {
  const values = JSON.parse(data)
  console.log(`Users parsed: ${values.length} rows`)
  return values
}

const processUser = async (value: Record<string, string>, importedFileDate: Date) => {
  const {
    User_Email: email,
    Firstname: firstName = '',
    Lastname: lastName = '',
    Session_Code: sessionCodeTraining,
    Company_Name: name,
    SIRET: siretOrSiren,
    Purchased_Products: purchasedProducts,
    Membership_Year: membershipYear,
  } = value

  const isCR = ['adhesion_conseil', 'licence_exploitation'].includes(purchasedProducts)
  const activatedLicence = membershipYear.includes(new Date().getFullYear().toString())

  const dbUser = (await prismaClient.user.findUnique({ where: { email } })) as Prisma.UserCreateManyInput

  const user: Prisma.UserCreateManyInput = {
    id: dbUser?.id,
    email,
    firstName,
    lastName,
    role: Role.DEFAULT,
    status: UserStatus.IMPORTED,
    importedFileDate,
  }

  if (sessionCodeTraining) {
    user.level = sessionCodeTraining.includes('BCM2') ? Level.Advanced : Level.Initial
  }

  if (siretOrSiren) {
    let organisation = dbUser?.organizationId
      ? await prismaClient.organization.findFirst({ where: { id: dbUser.organizationId } })
      : await prismaClient.organization.findFirst({ where: { siret: { startsWith: siretOrSiren } } })

    organisation = await prismaClient.organization.upsert({
      where: { id: organisation?.id || '' },
      update: {
        isCR: isCR || organisation?.isCR,
        importedFileDate,
        activatedLicence: activatedLicence || organisation?.activatedLicence,
      },
      create: {
        siret: siretOrSiren,
        name,
        isCR,
        importedFileDate,
        activatedLicence,
      },
    })

    user.organizationId = organisation.id
  }

  if (dbUser) {
    await prismaClient.user.update({
      where: { id: dbUser.id },
      data: {
        level: user.level,
        role: dbUser.status === UserStatus.IMPORTED ? user.role : undefined,
        organizationId: dbUser.status === UserStatus.IMPORTED ? user.organizationId : undefined,
      },
    })
    console.log(`Updating ${email} because already exists`)
    return null
  }

  return user
}

const getUsersFromFTP = async () => {
  try {
    const client = await getFTPClient()
    const folderPath = process.env.FTP_FILE_PATH || '/'
    const fileName = process.env.FTP_FILE_NAME || '/'
    const fileList = await client.list(folderPath)
    const file = fileList.find((f) => f.name === fileName)
    const importedFileDate = new Date(file?.rawModifiedAt || Date.now())

    const data = await downloadFileFromFTP(client, folderPath, fileName)
    const values = parseUsers(data)
    client.close()

    const users: Prisma.UserCreateManyInput[] = []
    for (let i = 0; i < values.length; i++) {
      const user = await processUser(values[i] as Record<string, string>, importedFileDate)
      if (user) {
        users.push(user)
      }
      if (i % 50 === 0) {
        console.log(`${i}/${values.length}`)
      }
    }

    const created = await prismaClient.user.createMany({ data: users, skipDuplicates: true })
    console.log(`${created.count} users created`)
  } catch (error) {
    console.error('Error importing users:', error)
  }
}

dotenv.config()
getUsersFromFTP()
