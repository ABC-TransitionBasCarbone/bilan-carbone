import { PrismaClient } from '@abc-transitionbascarbone/db-common'
import { UserStatus } from '@abc-transitionbascarbone/db-common/enums'
import { signPassword } from '@abc-transitionbascarbone/utils/auth'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({
  connectionString: process.env.POSTGRES_PRISMA_URL,
})

const prisma = new PrismaClient({ adapter }) as PrismaClient

const main = async () => {
  const password = await signPassword('password-0')
  await prisma.accountMip.deleteMany()

  const user = await prisma.user.upsert({
    where: { email: 'mip-admin-0@yopmail.com' },
    update: {},
    create: {
      email: 'mip-admin-0@yopmail.com',
      firstName: 'Admin',
      lastName: 'MIP',
      password,
    },
  })

  await prisma.accountMip.create({
    data: {
      userId: user.id,
      status: UserStatus.ACTIVE,
    },
  })
}

if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
  main()
    .then(async () => {
      await prisma.$disconnect()
    })
    .catch(async (e) => {
      console.error(e)
      await prisma.$disconnect()
      process.exit(1)
    })
}
