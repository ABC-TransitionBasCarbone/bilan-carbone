import { Level, PrismaClient, Role } from '@prisma/client'
import { faker } from '@faker-js/faker'
import { signPassword } from '@/services/auth'
import { ACTUALITIES } from './legacy_data/actualities'

const prisma = new PrismaClient()

const emissions = async () => {
  await prisma.emissionMetaData.deleteMany()
  await prisma.emission.deleteMany()
}

const users = async () => {
  await prisma.studyExport.deleteMany()
  await prisma.study.deleteMany()

  await prisma.site.deleteMany()
  await prisma.user.deleteMany()

  await prisma.organization.deleteMany()

  const organizations = await prisma.organization.createManyAndReturn({
    data: Array.from({ length: 5 }).map(() => ({
      name: faker.company.name(),
      isCR: faker.datatype.boolean(),
    })),
  })

  const crOrganizations = organizations.filter((organization) => organization.isCR)
  const regularOrganizations = organizations.filter((organization) => !organization.isCR)

  const childOrganizations = await prisma.organization.createManyAndReturn({
    data: Array.from({ length: 50 }).map(() => ({
      name: faker.company.name(),
      parentId: faker.helpers.arrayElement(crOrganizations).id,
      isCR: false,
    })),
  })

  await prisma.site.createMany({
    data: [...organizations, ...childOrganizations].flatMap((organization) => {
      const sitesNumber = faker.number.int({ min: 0, max: 3 })
      return Array.from({ length: sitesNumber }).map(() => ({
        name: faker.commerce.department(),
        organizationId: organization.id,
      }))
    }),
  })

  const levels = Object.keys(Level)
  await prisma.user.createMany({
    data: await Promise.all([
      ...Array.from({ length: 10 }).map(async (_, index) => {
        const password = await signPassword(`password-${index}`)
        return {
          email: `bc-test-user-${index}@yopmail.com`,
          firstName: faker.person.firstName(),
          lastName: faker.person.lastName(),
          organizationId: regularOrganizations[index % regularOrganizations.length].id,
          password,
          level: faker.helpers.arrayElement(levels) as Level,
          role: Role.DEFAULT,
        }
      }),
      ...Array.from({ length: 10 }).map(async (_, index) => {
        const password = await signPassword(`password-${index}`)
        return {
          email: `bc-cr-user-${index}@yopmail.com`,
          firstName: faker.person.firstName(),
          lastName: faker.person.lastName(),
          organizationId: crOrganizations[index % crOrganizations.length].id,
          password,
          level: faker.helpers.arrayElement(levels) as Level,
          role: Role.DEFAULT,
        }
      }),
    ]),
  })
}

const actualities = async () => {
  await prisma.actuality.deleteMany()
  await prisma.actuality.createMany({ data: ACTUALITIES })
}

const licenses = async () => {
  await prisma.license.deleteMany()
  await prisma.license.createMany({
    data: [
      {
        name: 'Exploitation',
        rights: [Role.ADMIN],
      },
      {
        name: 'Utilisation',
        rights: [Role.ADMIN],
      },
    ],
  })
}

const main = async () => {
  await Promise.all([actualities(), licenses(), users(), emissions()])
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
