import { PrismaClient, Role } from '@prisma/client'
import { faker } from '@faker-js/faker'
import { signPassword } from '@/services/auth'

const prisma = new PrismaClient()

const users = async () => {
  await prisma.user.deleteMany()
  await prisma.organisation.deleteMany()

  const organisation = await prisma.organisation.create({
    data: {
      name: 'ABC',
    },
  })

  await prisma.user.createMany({
    data: await Promise.all(
      Array.from({ length: 10 }).map(async (_, index) => {
        const password = await signPassword(`password-${index}`)
        return {
          email: `bc-test-user-${index}@yopmail.com`,
          firstName: faker.person.firstName(),
          lastName: faker.person.lastName(),
          organisationId: organisation.id,
          password,
          role: Role.DEFAULT,
        }
      }),
    ),
  })
}

const actualities = async () => {
  await prisma.actuality.deleteMany()
  await prisma.actuality.createMany({
    data: Array.from({ length: 10 }).map(() => ({
      text: faker.lorem.paragraph(),
      title: faker.lorem.sentence(),
    })),
  })
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
  await Promise.all([actualities(), licenses(), users()])
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
