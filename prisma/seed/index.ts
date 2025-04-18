import { signPassword } from '@/services/auth'
import { reCreateBegesRules } from '@/services/exportRules/beges'
import { getEmissionFactorsFromAPI } from '@/services/importEmissionFactor/baseEmpreinte/getEmissionFactorsFromAPI'
import { faker } from '@faker-js/faker'
import {
  EmissionFactorStatus,
  Import,
  Level,
  PrismaClient,
  Role,
  StudyRole,
  SubPost,
  Unit,
  User,
  UserChecklist,
  UserStatus,
} from '@prisma/client'
import { Command } from 'commander'
import { ACTUALITIES } from '../legacy_data/actualities'
import { createRealStudy } from './study'

const program = new Command()
type Params = {
  importFactors: string | undefined
}

const prisma = new PrismaClient()

const users = async () => {
  await prisma.emissionFactorPartMetaData.deleteMany()
  await prisma.emissionFactorPart.deleteMany()
  await prisma.emissionFactorMetaData.deleteMany()
  await prisma.emissionFactor.deleteMany()

  await prisma.userOnStudy.deleteMany()
  await prisma.studyExport.deleteMany()
  await prisma.studyEmissionSource.deleteMany()
  await prisma.studyEmissionFactorVersion.deleteMany()
  await prisma.contributors.deleteMany()

  await prisma.openingHours.deleteMany()
  await prisma.studySite.deleteMany()
  await prisma.document.deleteMany()
  await prisma.study.deleteMany()

  await prisma.emissionFactorImportVersion.deleteMany()

  await prisma.site.deleteMany()
  await prisma.userApplicationSettings.deleteMany()
  await prisma.user.deleteMany()

  await prisma.organization.deleteMany()

  await Promise.all([
    prisma.emissionFactor.create({
      data: {
        importedFrom: Import.Manual,
        status: EmissionFactorStatus.Valid,
        totalCo2: 111,
        completeness: 4,
        reliability: 5,
        importedId: '1',
        unit: Unit.KG,
        subPosts: [SubPost.MetauxPlastiquesEtVerre],
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
        importedFrom: Import.Manual,
        status: EmissionFactorStatus.Valid,
        totalCo2: 123,
        geographicRepresentativeness: 3,
        completeness: 1,
        reliability: 5,
        importedId: '2',
        unit: Unit.KG_DRY_MATTER,
        subPosts: [SubPost.MetauxPlastiquesEtVerre],
        metaData: {
          create: {
            language: 'fr',
            title: 'FE Test 2',
          },
        },
      },
    }),
    prisma.emissionFactor.create({
      data: {
        importedFrom: Import.Manual,
        status: EmissionFactorStatus.Archived,
        totalCo2: 42,
        geographicRepresentativeness: 4,
        completeness: 2,
        reliability: 3,
        importedId: '3',
        unit: Unit.CAR_KM,
        subPosts: [SubPost.MetauxPlastiquesEtVerre],
        metaData: {
          create: {
            language: 'fr',
            title: 'FE Test Archived',
          },
        },
      },
    }),
  ])

  const unOnboardedOrganization = await prisma.organization.create({
    data: {
      name: faker.company.name(),
      siret: faker.finance.accountNumber(14),
      isCR: false,
      onboarded: false,
      activatedLicence: true,
    },
  })
  const onboardingPassword = await signPassword('onboarding1234')
  await prisma.user.create({
    data: {
      email: 'onboarding@yopmail.com',
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      organizationId: unOnboardedOrganization.id,
      password: onboardingPassword,
      level: Level.Initial,
      role: Role.COLLABORATOR,
      status: UserStatus.IMPORTED,
    },
  })

  await prisma.user.create({
    data: {
      email: 'onboardingnottrained@yopmail.com',
      password: onboardingPassword,
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      organizationId: unOnboardedOrganization.id,
      role: Role.COLLABORATOR,
      status: UserStatus.IMPORTED,
    },
  })

  const clientLessOrganization = await prisma.organization.create({
    data: {
      name: faker.company.name(),
      siret: faker.finance.accountNumber(14),
      isCR: true,
      onboarded: true,
      activatedLicence: true,
    },
  })
  await prisma.user.create({
    data: {
      email: 'clientless@yopmail.com',
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      organizationId: clientLessOrganization.id,
      password: await signPassword(`client1234`),
      role: Role.COLLABORATOR,
      status: UserStatus.ACTIVE,
    },
  })

  const organizations = await prisma.organization.createManyAndReturn({
    data: Array.from({ length: 10 }).map((_, index) => ({
      name: faker.company.name(),
      siret: faker.finance.accountNumber(14),
      isCR: index % 2 === 0,
      onboarded: true,
      activatedLicence: true,
    })),
  })

  const crOrganizations = organizations.filter((organization) => organization.isCR)
  const regularOrganizations = organizations.filter((organization) => !organization.isCR)

  const childOrganizations = await prisma.organization.createManyAndReturn({
    data: Array.from({ length: 50 }).map(() => ({
      name: faker.company.name(),
      parentId: faker.helpers.arrayElement(crOrganizations).id,
      isCR: false,
      onboarded: true,
      activatedLicence: true,
    })),
  })

  const sites = await prisma.site.createManyAndReturn({
    data: [...organizations, ...childOrganizations].flatMap((organization) => {
      const sitesNumber = faker.number.int({ min: 1, max: 5 })
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
    data: await Promise.all([
      ...Object.keys(Role).flatMap((role) => [
        ...Array.from({ length: 3 }).map(async (_, index) => ({
          email: `bc-${role.toLocaleLowerCase()}-${index}@yopmail.com`,
          firstName: faker.person.firstName(),
          lastName: faker.person.lastName(),
          organizationId: regularOrganizations[index % regularOrganizations.length].id,
          password: await signPassword(`password-${index}`),
          level: levels[index % levels.length] as Level,
          role: role as Role,
          status: UserStatus.ACTIVE,
        })),
        ...Array.from({ length: 3 }).map(async (_, index) => ({
          email: `bc-cr-${role.toLocaleLowerCase()}-${index}@yopmail.com`,
          firstName: faker.person.firstName(),
          lastName: faker.person.lastName(),
          organizationId: crOrganizations[index % crOrganizations.length].id,
          password: await signPassword(`password-${index}`),
          level: levels[index % levels.length] as Level,
          role: role as Role,
          status: UserStatus.ACTIVE,
        })),
      ]),
      ...Array.from({ length: 3 }).map(async (_, index) => ({
        email: `bc-new-${index}@yopmail.com`,
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        organizationId: regularOrganizations[index % regularOrganizations.length].id,
        password: await signPassword(`password-${index}`),
        level: levels[index % levels.length] as Level,
        role: Role.COLLABORATOR,
        status: UserStatus.IMPORTED,
      })),
    ]),
  })

  const [contributor] = await prisma.user.createManyAndReturn({
    data: [
      {
        email: 'bc-contributor@yopmail.com',
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        password: await signPassword('password'),
        level: Level.Initial,
        organizationId: organizations[0].id,
        role: Role.COLLABORATOR,
        status: UserStatus.ACTIVE,
      },
      {
        email: 'untrained@yopmail.com',
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        password: await signPassword('password'),
        organizationId: regularOrganizations[1].id,
        role: Role.DEFAULT,
        status: UserStatus.ACTIVE,
      },
    ],
  })

  await prisma.user.create({
    data: {
      email: 'imported@yopmail.com',
      firstName: 'User',
      lastName: 'Imported',
      role: Role.COLLABORATOR,
      level: Level.Initial,
      status: UserStatus.IMPORTED,
      organizationId: regularOrganizations[0].id,
    },
  })

  const activeUsers = await prisma.user.findMany({ where: { status: UserStatus.ACTIVE }, select: { id: true } })
  await prisma.userCheckedStep.createMany({
    data: activeUsers.map((user) => ({ userId: user.id, step: UserChecklist.CreateAccount })),
  })

  const subPosts = Object.keys(SubPost)
  const studies = await Promise.all(
    Array.from({ length: 20 }).map(() => {
      const creator = faker.helpers.arrayElement(users.filter((user) => user.status === UserStatus.ACTIVE))
      const organizationSites = sites.filter((site) => site.organizationId === creator.organizationId)
      return prisma.study.create({
        include: { sites: true },
        data: {
          createdById: creator.id,
          startDate: new Date(),
          endDate: faker.date.future(),
          isPublic: faker.datatype.boolean(),
          level: faker.helpers.enumValue(Level),
          name: faker.lorem.words({ min: 2, max: 5 }),
          organizationId: creator.organizationId as string,
          sites: {
            createMany: {
              data: faker.helpers
                .arrayElements(organizationSites, { min: 1, max: organizationSites.length })
                .map((site) => ({
                  siteId: site.id,
                  etp: faker.helpers.maybe(() => faker.number.int({ min: 1, max: 100 })) || site.etp,
                  ca:
                    faker.helpers.maybe(
                      () => Math.round(faker.number.float({ min: 100_000, max: 1_000_000_000 })) / 100,
                    ) || site.ca,
                })),
            },
          },
          allowedUsers: {
            create: { role: StudyRole.Validator, userId: creator.id },
          },
        },
      })
    }),
  )

  const defaultUser = users.find((user) => user.email === 'bc-collaborator-0@yopmail.com') as User
  const reader = users.find((user) => user.email === 'bc-collaborator-1@yopmail.com') as User
  const editor = users.find((user) => user.email === 'bc-gestionnaire-0@yopmail.com') as User
  const organizationSites = sites.filter((site) => site.organizationId === defaultUser.organizationId)

  studies.push(
    await prisma.study.create({
      include: { sites: true },
      data: {
        id: '88c93e88-7c80-4be4-905b-f0bbd2ccc779',
        createdById: defaultUser.id,
        startDate: new Date(),
        endDate: faker.date.future(),
        isPublic: false,
        level: faker.helpers.enumValue(Level),
        name: faker.lorem.words({ min: 2, max: 5 }),
        organizationId: defaultUser.organizationId as string,
        sites: {
          createMany: {
            data: faker.helpers
              .arrayElements(organizationSites, { min: 1, max: organizationSites.length })
              .map((site) => ({
                siteId: site.id,
                etp: faker.helpers.maybe(() => faker.number.int({ min: 1, max: 100 })) || site.etp,
                ca:
                  faker.helpers.maybe(
                    () => Math.round(faker.number.float({ min: 100_000, max: 1_000_000_000 })) / 100,
                  ) || site.ca,
              })),
          },
        },
        allowedUsers: {
          createMany: {
            data: [
              { role: StudyRole.Validator, userId: defaultUser.id },
              { role: StudyRole.Reader, userId: reader.id },
              { role: StudyRole.Editor, userId: editor.id },
            ],
          },
        },
        contributors: {
          create: { userId: contributor.id, subPost: SubPost.MetauxPlastiquesEtVerre },
        },
      },
    }),
  )

  await Promise.all(
    studies.map(async (study) => {
      return prisma.studyEmissionSource.createMany({
        data: faker.helpers.arrayElements(subPosts, { min: 1, max: subPosts.length }).flatMap((subPost) =>
          Array.from({ length: Math.ceil(Math.random() * 20) }).map(() => ({
            studyId: study.id,
            name: faker.lorem.words({ min: 2, max: 5 }),
            subPost: subPost as SubPost,
            studySiteId: faker.helpers.arrayElement(study.sites).id,
          })),
        ),
      })
    }),
  )

  await createRealStudy(prisma, defaultUser)
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

const main = async (params: Params) => {
  await Promise.all([actualities(), licenses(), users(), reCreateBegesRules()])
  if (params.importFactors) {
    await getEmissionFactorsFromAPI(params.importFactors)
  }
}

program
  .name('seed database')
  .description('Clear and seed the database')
  .version('1.0.0')
  .option('-i, --import-factors <value>', 'Import BaseCarbone emission factors')
  .parse(process.argv)

if (process.env.NODE_ENV === 'development') {
  main(program.opts())
    .then(async () => {
      await prisma.$disconnect()
    })
    .catch(async (e) => {
      console.error(e)
      await prisma.$disconnect()
      process.exit(1)
    })
}
