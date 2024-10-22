import { PrismaClient, Role } from '@prisma/client'
import { faker } from '@faker-js/faker'
import { signPassword } from '@/services/auth'
import { ACTUALITIES } from './legacy_data/actualities'

const prisma = new PrismaClient()

const emissions = async () => {
  const emissionsToDelete = await prisma.emission.findMany({
    select: { id: true },
    where: { organizationId: { not: null } },
  })

  const ids = emissionsToDelete.map((emission) => emission.id)
  await prisma.emissionMetaData.deleteMany({
    where: { emissionId: { in: ids } },
  })
  await prisma.emission.deleteMany({
    where: { id: { in: ids } },
  })
}

const users = async () => {
  await prisma.studyExport.deleteMany()
  await prisma.study.deleteMany()

  await prisma.site.deleteMany()
  await prisma.cROrganization.deleteMany()
  await prisma.user.deleteMany()

  await prisma.organization.deleteMany()

  const organizations = await prisma.organization.createManyAndReturn({
    data: Array.from({ length: 5 }).map(() => ({
      name: faker.company.name(),
    })),
  })

  await prisma.site.createMany({
    data: organizations.flatMap((organization) => {
      const sitesNumber = faker.number.int({ min: 0, max: 3 })
      return Array.from({ length: sitesNumber }).map(() => ({
        name: faker.commerce.department(),
        organizationId: organization.id,
      }))
    }),
  })

  await prisma.user.createMany({
    data: await Promise.all([
      ...Array.from({ length: 10 }).map(async (_, index) => {
        const password = await signPassword(`password-${index}`)
        return {
          email: `bc-test-user-${index}@yopmail.com`,
          firstName: faker.person.firstName(),
          lastName: faker.person.lastName(),
          organizationId: organizations[index % organizations.length].id,
          password,
          role: Role.DEFAULT,
        }
      }),
      ...Array.from({ length: 10 }).map(async (_, index) => {
        const password = await signPassword(`password-${index}`)
        const organization = faker.helpers.arrayElement(organizations)
        return {
          email: `bc-cr-user-${index}@yopmail.com`,
          firstName: faker.person.firstName(),
          lastName: faker.person.lastName(),
          organizationId: organization.id,
          password,
          role: Role.CR,
        }
      }),
    ]),
  })

  const crUsers = await prisma.user.findMany({ where: { role: Role.CR } })

  await prisma.cROrganization.createMany({
    skipDuplicates: true,
    data: Array.from({ length: 50 }).map(() => ({
      userId: faker.helpers.arrayElement(crUsers).id,
      organizationId: faker.helpers.arrayElement(organizations).id,
    })),
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
        rights: [Role.DEFAULT],
      },
      {
        name: 'Utilisation',
        rights: [Role.DEFAULT],
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
