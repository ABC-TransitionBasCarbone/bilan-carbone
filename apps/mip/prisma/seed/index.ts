import { PrismaClient } from '@abc-transitionbascarbone/db-common'
import { Role, UserStatus } from '@abc-transitionbascarbone/db-common/enums'
import { signPassword } from '@abc-transitionbascarbone/utils/auth'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({
  connectionString: process.env.POSTGRES_PRISMA_URL,
})

const prisma = new PrismaClient({ adapter }) as PrismaClient

const main = async () => {
  const accountsMip = await prisma.accountMip.findMany({ select: { userId: true } })
  const userIds = accountsMip.map((a) => a.userId)

  await prisma.accountMip.deleteMany()
  await prisma.user.deleteMany({ where: { id: { in: userIds } } })

  const password = await signPassword('password-0')
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
      role: Role.ADMIN,
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
