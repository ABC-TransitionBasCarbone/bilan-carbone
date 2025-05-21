import { reCreateBegesRules } from '@/db/beges'
import { signPassword } from '@/services/auth'
import { getEmissionFactorsFromAPI } from '@/services/importEmissionFactor/baseEmpreinte/getEmissionFactorsFromAPI'
import { faker } from '@faker-js/faker'
import {
  Account,
  EmissionFactorStatus,
  Environment,
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
  await prisma.userCheckedStep.deleteMany()
  await prisma.userApplicationSettings.deleteMany()
  await prisma.account.deleteMany()
  await prisma.user.deleteMany()

  await prisma.organizationVersion.deleteMany()
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
      wordpressId: faker.finance.accountNumber(14),
    },
  })

  const unOnboardedOrganizationVersion = await prisma.organizationVersion.create({
    data: {
      isCR: false,
      onboarded: false,
      activatedLicence: true,
      organizationId: unOnboardedOrganization.id,
      environment: Environment.BC,
    },
  })

  const onboardingPassword = await signPassword('onboarding1234')
  const onboarding = await prisma.user.create({
    data: {
      email: 'onboarding@yopmail.com',
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      password: onboardingPassword,
      level: Level.Initial,
      status: UserStatus.IMPORTED,
    },
  })

  await prisma.account.create({
    data: {
      organizationVersionId: unOnboardedOrganizationVersion.id,
      role: Role.COLLABORATOR,
      userId: onboarding.id,
    },
  })
  const onboardingNotTrained = await prisma.user.create({
    data: {
      email: 'onboardingnottrained@yopmail.com',
      password: onboardingPassword,
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      status: UserStatus.IMPORTED,
    },
  })

  await prisma.account.create({
    data: {
      organizationVersionId: unOnboardedOrganizationVersion.id,
      role: Role.COLLABORATOR,
      userId: onboardingNotTrained.id,
    },
  })

  const clientLessOrganization = await prisma.organization.create({
    data: {
      name: faker.company.name(),
      wordpressId: faker.finance.accountNumber(14),
    },
  })

  const clientLessOrganizationVersion = await prisma.organizationVersion.create({
    data: {
      isCR: true,
      onboarded: true,
      activatedLicence: true,
      organizationId: clientLessOrganization.id,
      environment: Environment.BC,
    },
  })

  const clientLessUser = await prisma.user.create({
    data: {
      email: 'clientless@yopmail.com',
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      password: await signPassword(`client1234`),
      level: Level.Initial,
      status: UserStatus.ACTIVE,
    },
  })

  await prisma.account.create({
    data: {
      organizationVersionId: clientLessOrganizationVersion.id,
      role: Role.COLLABORATOR,
      userId: clientLessUser.id,
    },
  })

  const organizations = await prisma.organization.createManyAndReturn({
    data: Array.from({ length: 10 }).map(() => ({
      name: faker.company.name(),
      wordpressId: faker.finance.accountNumber(14),
    })),
  })

  const organizationVersions = await prisma.organizationVersion.createManyAndReturn({
    data: organizations.map((organization, index) => ({
      organizationId: organization.id,
      isCR: index % 2 === 0,
      onboarded: true,
      activatedLicence: true,
      environment: Environment.BC,
    })),
  })

  const crOrganizationVersions = organizationVersions.filter((organization) => organization.isCR)
  const regularOrganizationVersions = organizationVersions.filter((organization) => !organization.isCR)

  const childOrganizations = await prisma.organization.createManyAndReturn({
    data: Array.from({ length: 50 }).map(() => ({
      name: faker.company.name(),
    })),
  })

  await prisma.organizationVersion.createManyAndReturn({
    data: childOrganizations.map((childOrganization) => ({
      parentId: faker.helpers.arrayElement(crOrganizationVersions).id,
      organizationId: childOrganization.id,
      isCR: false,
      onboarded: true,
      activatedLicence: true,
      environment: Environment.BC,
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
  const usersWithAccounts = await Promise.all([
    ...Object.keys(Role).flatMap((role) => [
      ...Array.from({ length: 3 }).map(async (_, index) => {
        const user = await prisma.user.create({
          data: {
            email: `bc-${role.toLocaleLowerCase()}-${index}@yopmail.com`,
            firstName: faker.person.firstName(),
            lastName: faker.person.lastName(),
            password: await signPassword(`password-${index}`),
            level: levels[index % levels.length] as Level,
            status: UserStatus.ACTIVE,
          },
        })
        const account = await prisma.account.create({
          data: {
            organizationVersionId: regularOrganizationVersions[index % regularOrganizationVersions.length].id,
            role: role as Role,
            userId: user.id,
          },
        })

        if (!account.organizationVersionId) {
          return { user, account, organizationVersion: { organizationId: null } }
        }
        const organizationVersion = await prisma.organizationVersion.findFirst({
          where: { id: account.organizationVersionId },
        })
        if (!organizationVersion) {
          return { user, account, organizationVersion: { organizationId: null } }
        }
        return { user, account, organizationVersion }
      }),
      ...Array.from({ length: 3 }).map(async (_, index) => {
        const user = await prisma.user.create({
          data: {
            email: `bc-cr-${role.toLocaleLowerCase()}-${index}@yopmail.com`,
            firstName: faker.person.firstName(),
            lastName: faker.person.lastName(),
            password: await signPassword(`password-${index}`),
            level: levels[index % levels.length] as Level,
            status: UserStatus.ACTIVE,
          },
        })
        const account = await prisma.account.create({
          data: {
            organizationVersionId: crOrganizationVersions[index % crOrganizationVersions.length].id,
            role: role as Role,
            userId: user.id,
          },
        })
        if (!account.organizationVersionId) {
          return { user, account, organizationVersion: { organizationId: null } }
        }
        const organizationVersion = await prisma.organizationVersion.findFirst({
          where: { id: account.organizationVersionId },
        })
        if (!organizationVersion) {
          return { user, account, organizationVersion: { organizationId: null } }
        }
        return { user, account, organizationVersion }
      }),
    ]),
    ...Array.from({ length: 3 }).map(async (_, index) => {
      const user = await prisma.user.create({
        data: {
          email: `bc-new-${index}@yopmail.com`,
          firstName: faker.person.firstName(),
          lastName: faker.person.lastName(),
          password: await signPassword(`password-${index}`),
          level: levels[index % levels.length] as Level,
          status: UserStatus.IMPORTED,
        },
      })
      const account = await prisma.account.create({
        data: {
          organizationVersionId: regularOrganizationVersions[index % regularOrganizationVersions.length].id,
          role: Role.COLLABORATOR,
          userId: user.id,
        },
      })
      if (!account.organizationVersionId) {
        return { user, account, organizationVersion: { organizationId: null } }
      }
      const organizationVersion = await prisma.organizationVersion.findFirst({
        where: { id: account.organizationVersionId },
      })
      if (!organizationVersion) {
        return { user, account, organizationVersion: { organizationId: null } }
      }
      return { user, account, organizationVersion }
    }),
  ])

  const [contributor] = await Promise.all([
    prisma.account.create({
      data: {
        organizationVersionId: organizationVersions[0].id,
        role: Role.COLLABORATOR,
        userId: (
          await prisma.user.create({
            data: {
              email: 'bc-contributor@yopmail.com',
              firstName: faker.person.firstName(),
              lastName: faker.person.lastName(),
              password: await signPassword('password'),
              level: Level.Initial,
              status: UserStatus.ACTIVE,
            },
          })
        ).id,
      },
    }),
    prisma.account.create({
      data: {
        organizationVersionId: regularOrganizationVersions[1].id,
        role: Role.DEFAULT,
        userId: (
          await prisma.user.create({
            data: {
              email: 'untrained@yopmail.com',
              firstName: faker.person.firstName(),
              lastName: faker.person.lastName(),
              password: await signPassword('password'),
              status: UserStatus.ACTIVE,
            },
          })
        ).id,
      },
    }),
  ])

  await prisma.user
    .create({
      data: {
        email: 'imported@yopmail.com',
        firstName: 'User',
        lastName: 'Imported',
        level: Level.Initial,
        status: UserStatus.IMPORTED,
      },
    })
    .then(async (user) => {
      await prisma.account.create({
        data: {
          organizationVersionId: regularOrganizationVersions[0].id,
          role: Role.COLLABORATOR,
          userId: user.id,
        },
      })
    })

  const activeAccounts = await prisma.account.findMany({
    where: { user: { status: UserStatus.ACTIVE } },
    select: { id: true },
  })
  await prisma.userCheckedStep.createMany({
    data: activeAccounts.map((account) => ({ accountId: account.id, step: UserChecklist.CreateAccount })),
  })

  const subPosts = Object.keys(SubPost)
  const studies = await Promise.all(
    Array.from({ length: 20 }).map(() => {
      const creator = faker.helpers.arrayElement(
        usersWithAccounts.filter((userWithAccount) => userWithAccount.user.status === UserStatus.ACTIVE),
      )

      const organizationVersionSites = sites.filter(
        (site) => site.organizationId === creator.organizationVersion.organizationId,
      )
      return prisma.study.create({
        include: { sites: true },
        data: {
          createdById: creator.account.id,
          startDate: new Date(),
          endDate: faker.date.future(),
          isPublic: faker.datatype.boolean(),
          level: faker.helpers.enumValue(Level),
          name: faker.lorem.words({ min: 2, max: 5 }),
          organizationVersionId: creator.account.organizationVersionId as string,
          sites: {
            createMany: {
              data: faker.helpers
                .arrayElements(organizationVersionSites, { min: 1, max: organizationVersionSites.length })
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
            create: { role: StudyRole.Validator, accountId: creator.account.id },
          },
        },
      })
    }),
  )

  const defaultUserWithAccount = usersWithAccounts.find(
    (userWithAccount) => userWithAccount.user.email === 'bc-collaborator-0@yopmail.com',
  ) as { user: User; account: Account }
  const readerWithAccount = usersWithAccounts.find(
    (userWithAccount) => userWithAccount.user.email === 'bc-collaborator-1@yopmail.com',
  ) as { user: User; account: Account }
  const editorWithAccount = usersWithAccounts.find(
    (userWithAccount) => userWithAccount.user.email === 'bc-gestionnaire-0@yopmail.com',
  ) as { user: User; account: Account }

  if (!defaultUserWithAccount.account.organizationVersionId) {
    return null
  }
  const defaultUserWithAccountOrganizationVersion = await prisma.organizationVersion.findFirst({
    where: { id: defaultUserWithAccount.account.organizationVersionId },
  })
  if (!defaultUserWithAccountOrganizationVersion) {
    return null
  }
  const organizationVersionSites = sites.filter(
    (site) => site.organizationId === defaultUserWithAccountOrganizationVersion.organizationId,
  )

  studies.push(
    await prisma.study.create({
      include: { sites: true },
      data: {
        id: '88c93e88-7c80-4be4-905b-f0bbd2ccc779',
        createdById: defaultUserWithAccount.account.id,
        startDate: new Date(),
        endDate: faker.date.future(),
        isPublic: false,
        level: faker.helpers.enumValue(Level),
        name: faker.lorem.words({ min: 2, max: 5 }),
        organizationVersionId: defaultUserWithAccount.account.organizationVersionId as string,
        sites: {
          createMany: {
            data: faker.helpers
              .arrayElements(organizationVersionSites, { min: 1, max: organizationVersionSites.length })
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
              { role: StudyRole.Validator, accountId: defaultUserWithAccount.account.id },
              { role: StudyRole.Reader, accountId: readerWithAccount.account.id },
              { role: StudyRole.Editor, accountId: editorWithAccount.account.id },
            ],
          },
        },
        contributors: {
          create: { accountId: contributor.id, subPost: SubPost.MetauxPlastiquesEtVerre },
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

  await createRealStudy(prisma, defaultUserWithAccount.account)
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
