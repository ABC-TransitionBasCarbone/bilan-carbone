import { PrismaClient } from '@abc-transitionbascarbone/db-common'
import { RoleMip, UserStatus } from '@abc-transitionbascarbone/db-common/enums'
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

  const organizationVersionsMip = await prisma.organizationVersionMip.findMany({ select: { organizationId: true } })
  const organizationIds = organizationVersionsMip.map((a) => a.organizationId)

  await prisma.modelCampaign.deleteMany()
  await prisma.organizationVersionMip.deleteMany()
  await prisma.user.deleteMany({ where: { id: { in: organizationIds } } })

  const organization = await prisma.organization.create({
    data: {
      name: 'MIP Organization with mip versions',
    },
  })

  const organizationVersionMip = await prisma.organizationVersionMip.create({
    data: {
      organizationId: organization.id,
      name: 'MIP Organization Version',
    },
  })

  const password = await signPassword('password-0')
  for (const role of Object.keys(RoleMip)) {
    const user = await prisma.user.upsert({
      where: { email: `mip-${role.toLocaleLowerCase()}-0@yopmail.com` },
      update: {},
      create: {
        email: `mip-${role.toLocaleLowerCase()}-0@yopmail.com`,
        firstName: role,
        lastName: 'MIP',
        password,
      },
    })

    await prisma.accountMip.create({
      data: {
        userId: user.id,
        status: UserStatus.ACTIVE,
        role: role as RoleMip,
        organizationVersionMipId: organizationVersionMip.id,
      },
    })
  }

  const modelCampaign = await prisma.modelCampaign.create({
    data: {
      name: 'Test Model Campaign',
      model: {
        hello: 'Hello',
      },
    },
  })

  await prisma.organizationVersionMip.update({
    where: {
      id: organizationVersionMip.id,
    },
    data: {
      modelCampaignId: modelCampaign.id,
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
