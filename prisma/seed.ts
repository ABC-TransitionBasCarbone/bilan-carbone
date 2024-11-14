import { EmissionFactorStatus, Import, Level, PrismaClient, Role, StudyRole, SubPost, Unit, User } from '@prisma/client'
import { faker } from '@faker-js/faker'
import { signPassword } from '@/services/auth'
import { ACTUALITIES } from './legacy_data/actualities'

const prisma = new PrismaClient()

const users = async () => {
  await prisma.emissionFactorPartMetaData.deleteMany()
  await prisma.emissionFactorPart.deleteMany()
  await prisma.emissionFactorMetaData.deleteMany()
  await prisma.emissionFactor.deleteMany()

  await prisma.userOnStudy.deleteMany()
  await prisma.studyExport.deleteMany()
  await prisma.studyEmissionSource.deleteMany()
  await prisma.study.deleteMany()

  await prisma.site.deleteMany()
  await prisma.user.deleteMany()

  await prisma.organization.deleteMany()

  await Promise.all([
    prisma.emissionFactor.create({
      data: {
        importedFrom: Import.BaseEmpreinte,
        status: EmissionFactorStatus.Valid,
        totalCo2: 111,
        completeness: 4,
        reliability: 5,
        importedId: '1',
        unit: Unit.KG,
        metaData: {
          create: {
            language: 'fr',
            title: 'FE Test 1',
          },
        },
      },
    }),
    prisma.emissionFactor.create({
      data: {
        importedFrom: Import.BaseEmpreinte,
        status: EmissionFactorStatus.Valid,
        totalCo2: 123,
        geographicRepresentativeness: 3,
        completeness: 1,
        reliability: 5,
        importedId: '2',
        unit: Unit.KG_DRY_MATTER,
        metaData: {
          create: {
            language: 'fr',
            title: 'FE Test 2',
          },
        },
      },
    }),
  ])

  const organizations = await prisma.organization.createManyAndReturn({
    data: Array.from({ length: 10 }).map((_, index) => ({
      name: faker.company.name(),
      isCR: index % 2 === 0,
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
        etp: faker.number.int({ min: 1, max: 100 }),
        ca: Math.round(faker.number.float({ min: 100_000, max: 1_000_000_000 })) / 100,
        organizationId: organization.id,
      }))
    }),
  })

  const levels = Object.keys(Level)
  const users = await prisma.user.createManyAndReturn({
    data: await Promise.all(
      Object.keys(Role).flatMap((role) => [
        ...Array.from({ length: 3 }).map(async (_, index) => {
          const password = await signPassword(`password-${index}`)
          return {
            email: `bc-${role.toLocaleLowerCase()}-${index}@yopmail.com`,
            firstName: faker.person.firstName(),
            lastName: faker.person.lastName(),
            organizationId: regularOrganizations[index % regularOrganizations.length].id,
            password,
            level: levels[index % levels.length] as Level,
            role: role as Role,
            isActive: true,
          }
        }),
        ...Array.from({ length: 3 }).map(async (_, index) => {
          const password = await signPassword(`password-${index}`)
          return {
            email: `bc-cr-${role.toLocaleLowerCase()}-${index}@yopmail.com`,
            firstName: faker.person.firstName(),
            lastName: faker.person.lastName(),
            organizationId: crOrganizations[index % crOrganizations.length].id,
            password,
            level: levels[index % levels.length] as Level,
            role: role as Role,
            isActive: true,
          }
        }),
      ]),
    ),
  })

  const subPosts = Object.keys(SubPost)
  await Promise.all(
    Array.from({ length: 20 }).map((_, index) => {
      const creator =
        index === 0
          ? (users.find((user) => user.email === 'bc-default-0@yopmail.com') as User)
          : faker.helpers.arrayElement(users)
      return prisma.study.create({
        data: {
          createdById: creator.id,
          startDate: new Date(),
          endDate: faker.date.future(),
          isPublic: faker.datatype.boolean(),
          level: faker.helpers.enumValue(Level),
          name: faker.lorem.words({ min: 2, max: 5 }),
          organizationId: creator.organizationId,
          emissionSources: {
            createMany: {
              data: faker.helpers.arrayElements(subPosts, { min: 1, max: subPosts.length }).flatMap((subPost) =>
                Array.from({ length: Math.ceil(Math.random() * 20) }).map(() => ({
                  name: faker.lorem.words({ min: 2, max: 5 }),
                  subPost: subPost as SubPost,
                })),
              ),
            },
          },
          allowedUsers: {
            create: { role: StudyRole.Validator, userId: creator.id },
          },
        },
      })
    }),
  )
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
