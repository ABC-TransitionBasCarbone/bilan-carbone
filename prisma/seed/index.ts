import { environmentsWithChecklist } from '@/constants/environments'
import { DefaultStudyTags } from '@/constants/studyTags'
import { reCreateBegesRules } from '@/db/beges'
import { signPassword } from '@/services/auth'
import { getEmissionFactorsFromAPI } from '@/services/importEmissionFactor/baseEmpreinte/getEmissionFactorsFromAPI'
import { getAllowedLevels } from '@/services/study'
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
import { getCutRoleFromBase } from './utils'

const program = new Command()
type Params = {
  importFactors: string | undefined
}

type userAndAccountsAndOrganizationVersion = {
  user: User
  accounts: {
    account: Account
    organizationVersion: { organizationId: string | null }
  }[]
}

const prisma = new PrismaClient()

const users = async () => {
  await prisma.answer.deleteMany()
  await prisma.question.deleteMany()

  await prisma.emissionFactorPartMetaData.deleteMany()
  await prisma.emissionFactorPart.deleteMany()
  await prisma.emissionFactorMetaData.deleteMany()
  await prisma.emissionFactor.deleteMany()

  await prisma.emissionSourceTag.deleteMany()
  await prisma.studyTag.deleteMany()
  await prisma.studyTagFamily.deleteMany()

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

  await prisma.cnc.deleteMany()

  await prisma.deactivatableFeatureStatus.deleteMany()

  await prisma.cnc.create({
    data: {
      cncCode: '1321',
      nom: 'PATHE',
      codeInsee: '75102',
      commune: 'Paris 2e Arrondissement',
      ecrans: 21,
    },
  })

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
    },
  })

  await prisma.account.create({
    data: {
      organizationVersionId: unOnboardedOrganizationVersion.id,
      role: Role.COLLABORATOR,
      userId: onboarding.id,
      environment: Environment.BC,
      status: UserStatus.IMPORTED,
    },
  })
  const onboardingNotTrained = await prisma.user.create({
    data: {
      email: 'onboardingnottrained@yopmail.com',
      password: onboardingPassword,
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
    },
  })

  await prisma.account.create({
    data: {
      organizationVersionId: unOnboardedOrganizationVersion.id,
      role: Role.COLLABORATOR,
      userId: onboardingNotTrained.id,
      environment: Environment.BC,
      status: UserStatus.IMPORTED,
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
    },
  })

  await prisma.account.create({
    data: {
      organizationVersionId: clientLessOrganizationVersion.id,
      role: Role.COLLABORATOR,
      userId: clientLessUser.id,
      environment: Environment.BC,
      status: UserStatus.ACTIVE,
    },
  })

  const organizationVersionCutSignup = await prisma.organizationVersion.create({
    data: {
      environment: Environment.CUT,
      organizationId: (
        await prisma.organization.create({
          data: {
            name: faker.company.name(),
            wordpressId: '1234567891234',
          },
        })
      ).id,
    },
  })

  await prisma.account.create({
    data: {
      organizationVersionId: organizationVersionCutSignup.id,
      role: Role.ADMIN,
      environment: Environment.CUT,
      status: UserStatus.ACTIVE,
      userId: (
        await prisma.user.create({
          data: {
            email: 'cut-admin-test@yopmail.com',
            firstName: faker.person.firstName(),
            lastName: faker.person.lastName(),
            password: await signPassword('password'),
          },
        })
      ).id,
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
      isCR: index % 2 === 1,
      onboarded: true,
      environment: Environment.BC,
      activatedLicence: [new Date().getFullYear()],
    })),
  })

  const organizationVersionsCUT = await prisma.organizationVersion.createManyAndReturn({
    data: organizations.map((organization) => ({
      organizationId: organization.id,
      isCR: false,
      onboarded: false,
      environment: Environment.CUT,
      activatedLicence: [],
    })),
  })

  const organizationVersionsTILT = await prisma.organizationVersion.createManyAndReturn({
    data: organizations.map((organization, index) => ({
      organizationId: organization.id,
      isCR: index % 2 === 1,
      onboarded: false,
      environment: Environment.TILT,
      activatedLicence: [],
    })),
  })

  const organizationVersionsClickson = await prisma.organizationVersion.createManyAndReturn({
    data: organizations.map((organization) => ({
      organizationId: organization.id,
      isCR: false,
      onboarded: false,
      environment: Environment.CLICKSON,
      activatedLicence: [],
    })),
  })

  const crOrganizationVersions = organizationVersions.filter((organization) => organization.isCR)
  const regularOrganizationVersions = organizationVersions.filter((organization) => !organization.isCR)

  const regularTiltOrganizationVersions = organizationVersionsTILT.filter((organization) => !organization.isCR)
  const crTiltOrganizationVersions = organizationVersionsTILT.filter((organization) => organization.isCR)

  const environmentOrganizationVersions = {
    [Environment.BC]: regularOrganizationVersions,
    [Environment.CUT]: organizationVersionsCUT,
    [Environment.TILT]: regularTiltOrganizationVersions,
    [Environment.CLICKSON]: organizationVersionsClickson,
  }

  const childOrganizations = await prisma.organization.createManyAndReturn({
    data: Array.from({ length: 50 }).map(() => ({
      name: faker.company.name(),
    })),
  })

  await Promise.all([
    prisma.emissionFactor.create({
      data: {
        importedFrom: Import.Manual,
        status: EmissionFactorStatus.Valid,
        totalCo2: 111,
        completeness: 4,
        reliability: 5,
        technicalRepresentativeness: 5,
        temporalRepresentativeness: 5,
        importedId: '1',
        unit: Unit.KG,
        isMonetary: false,
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
        technicalRepresentativeness: 5,
        temporalRepresentativeness: 5,
        importedId: '2',
        unit: Unit.KG_DRY_MATTER,
        isMonetary: false,
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
        technicalRepresentativeness: 5,
        temporalRepresentativeness: 5,
        completeness: 2,
        reliability: 3,
        importedId: '3',
        unit: Unit.CAR_KM,
        isMonetary: false,
        subPosts: [SubPost.MetauxPlastiquesEtVerre],
        organizationId: regularOrganizationVersions[0]?.organizationId,
        metaData: {
          create: {
            language: 'fr',
            title: 'FE Test Archived',
          },
        },
      },
    }),
  ])

  await prisma.organizationVersion.createManyAndReturn({
    data: childOrganizations.map((childOrganization) => ({
      parentId: faker.helpers.arrayElement(crOrganizationVersions).id,
      organizationId: childOrganization.id,
      isCR: false,
      onboarded: true,
      environment: Environment.BC,
    })),
  })

  const cncRecord = await prisma.cnc.findUnique({ where: { cncCode: '1321' } })

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

  if (cncRecord) {
    const cutOrganizationIds = organizationVersionsCUT.map((orgVersion) => orgVersion.organizationId)
    const cutSites = sites.filter((site) => cutOrganizationIds.includes(site.organizationId))

    await Promise.all(
      cutSites.map((site) =>
        prisma.site.update({
          where: { id: site.id },
          data: { cncId: cncRecord.id },
        }),
      ),
    )
  }

  const clicksonOrganizationIds = organizationVersionsClickson.map((orgVersion) => orgVersion.organizationId)
  const clicksonSite = sites.find((site) => clicksonOrganizationIds.includes(site.organizationId))
  if (clicksonSite) {
    await prisma.site.update({
      where: { id: clicksonSite.id },
      data: { establishmentId: '0781494A', name: 'Ecole élémentaire Mansart', establishmentYear: '1965' },
    })
  }

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
            level: levels[levels.length - 1 - (index % levels.length)] as Level, // on veut que les bc 0 soient en Advanced pour les tests
          },
        })
        const account = await prisma.account.create({
          data: {
            organizationVersionId: regularOrganizationVersions[index % regularOrganizationVersions.length].id,
            role: role as Role,
            userId: user.id,
            environment: Environment.BC,
            status: UserStatus.ACTIVE,
          },
        })

        if (!account.organizationVersionId) {
          return { user, accounts: [{ account, organizationVersion: { organizationId: null } }] }
        }
        const organizationVersion = await prisma.organizationVersion.findFirst({
          where: { id: account.organizationVersionId },
        })
        if (!organizationVersion) {
          return { user, accounts: [{ account, organizationVersion: { organizationId: null } }] }
        }
        return { user, accounts: [{ account, organizationVersion }] }
      }),
      ...Array.from({ length: 3 }).map(async (_, index) => {
        const user = await prisma.user.create({
          data: {
            email: `bc-cr-${role.toLocaleLowerCase()}-${index}@yopmail.com`,
            firstName: faker.person.firstName(),
            lastName: faker.person.lastName(),
            password: await signPassword(`password-${index}`),
            level: levels[index % levels.length] as Level,
          },
        })
        const account = await prisma.account.create({
          data: {
            organizationVersionId: crOrganizationVersions[index % crOrganizationVersions.length].id,
            role: role as Role,
            userId: user.id,
            environment: Environment.BC,
            status: UserStatus.ACTIVE,
          },
        })
        if (!account.organizationVersionId) {
          return { user, accounts: [{ account, organizationVersion: { organizationId: null } }] }
        }
        const organizationVersion = await prisma.organizationVersion.findFirst({
          where: { id: account.organizationVersionId },
        })
        if (!organizationVersion) {
          return { user, accounts: [{ account, organizationVersion: { organizationId: null } }] }
        }
        return { user, accounts: [{ account, organizationVersion }] }
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
        },
      })
      const account = await prisma.account.create({
        data: {
          organizationVersionId: regularOrganizationVersions[index % regularOrganizationVersions.length].id,
          role: Role.COLLABORATOR,
          userId: user.id,
          environment: Environment.BC,
          status: UserStatus.IMPORTED,
        },
      })
      if (!account.organizationVersionId) {
        return { user, accounts: [{ account, organizationVersion: { organizationId: null } }] }
      }
      const organizationVersion = await prisma.organizationVersion.findFirst({
        where: { id: account.organizationVersionId },
      })
      if (!organizationVersion) {
        return { user, accounts: [{ account, organizationVersion: { organizationId: null } }] }
      }
      return { user, accounts: [{ account, organizationVersion }] }
    }),
    ...Object.keys(Role).flatMap((role) => [
      ...Object.keys(Environment).flatMap((environment) => [
        ...Array.from({ length: 2 }).map(async (_, index) => {
          const user = await prisma.user.create({
            data: {
              email: `${environment.toLocaleLowerCase()}-env-${role.toLocaleLowerCase()}-${index}@yopmail.com`,
              firstName: faker.person.firstName(),
              lastName: faker.person.lastName(),
              password: await signPassword(`password-${index}`),
              level: levels[index % levels.length] as Level,
            },
          })

          const organizationVersionArray = environmentOrganizationVersions[environment as Environment]
          const account = await prisma.account.create({
            data: {
              organizationVersionId: organizationVersionArray[index % organizationVersionArray.length].id,
              role: environment === Environment.CUT ? getCutRoleFromBase(role as Role) : (role as Role),
              userId: user.id,
              environment: environment as Environment,
              status: UserStatus.ACTIVE,
            },
          })
          if (!account.organizationVersionId) {
            return { user, accounts: [{ account, organizationVersion: { organizationId: null } }] }
          }
          const organizationVersion = await prisma.organizationVersion.findFirst({
            where: { id: account.organizationVersionId },
          })
          if (!organizationVersion) {
            return { user, accounts: [{ account, organizationVersion: { organizationId: null } }] }
          }
          return { user, accounts: [{ account, organizationVersion }] }
        }),
      ]),
      ...Array.from({ length: 2 }).map(async (_, index) => {
        const user = await prisma.user.create({
          data: {
            email: `all-env-${role.toLocaleLowerCase()}-${index}@yopmail.com`,
            firstName: faker.person.firstName(),
            lastName: faker.person.lastName(),
            password: await signPassword(`password-${index}`),
            level: levels[index % levels.length] as Level,
          },
        })
        const accountsData = [
          {
            organizationVersionId: regularOrganizationVersions[index % regularOrganizationVersions.length].id,
            role: role as Role,
            userId: user.id,
            environment: Environment.BC,
            status: UserStatus.ACTIVE,
          },
          {
            organizationVersionId: organizationVersionsCUT[index % organizationVersionsCUT.length].id,
            role: getCutRoleFromBase(role as Role),
            userId: user.id,
            environment: Environment.CUT,
            status: UserStatus.ACTIVE,
          },
          {
            organizationVersionId: organizationVersionsTILT[index % organizationVersionsTILT.length].id,
            role: role as Role,
            userId: user.id,
            environment: Environment.TILT,
            status: UserStatus.ACTIVE,
          },
          {
            organizationVersionId: organizationVersionsClickson[index % organizationVersionsClickson.length].id,
            role: role as Role,
            userId: user.id,
            environment: Environment.CLICKSON,
            status: UserStatus.ACTIVE,
          },
        ]
        const accounts = await prisma.account.createManyAndReturn({
          data: accountsData,
        })

        const organizationVersions = await prisma.organizationVersion.findMany({
          where: {
            id: {
              in: accounts.map((account) => account.organizationVersionId).filter((id): id is string => id !== null),
            },
          },
        })

        const accountsAndOrganizationVersions = accounts.map((account) => {
          const organizationVersion = organizationVersions.find((org) => org.id === account.organizationVersionId)
          if (!organizationVersion) {
            return { account, organizationVersion: { organizationId: null } }
          }
          return { account, organizationVersion }
        })
        return { user, accounts: accountsAndOrganizationVersions }
      }),
      // all-env-cr (if possible)
      ...Array.from({ length: 2 }).map(async (_, index) => {
        const user = await prisma.user.create({
          data: {
            email: `all-env-cr-${role.toLocaleLowerCase()}-${index}@yopmail.com`,
            firstName: faker.person.firstName(),
            lastName: faker.person.lastName(),
            password: await signPassword(`password-${index}`),
            level: levels[index % levels.length] as Level,
          },
        })
        const accountsData = [
          {
            organizationVersionId: crOrganizationVersions[index % crOrganizationVersions.length].id,
            role: role as Role,
            userId: user.id,
            environment: Environment.BC,
            status: UserStatus.ACTIVE,
          },
          {
            organizationVersionId: organizationVersionsCUT[index % organizationVersionsCUT.length].id,
            role: getCutRoleFromBase(role as Role),
            userId: user.id,
            environment: Environment.CUT,
            status: UserStatus.ACTIVE,
          },
          {
            organizationVersionId: crTiltOrganizationVersions[index % crTiltOrganizationVersions.length].id,
            role: role as Role,
            userId: user.id,
            environment: Environment.TILT,
            status: UserStatus.ACTIVE,
          },
        ]
        const accounts = await prisma.account.createManyAndReturn({
          data: accountsData,
        })

        const organizationVersions = await prisma.organizationVersion.findMany({
          where: {
            id: {
              in: accounts.map((account) => account.organizationVersionId).filter((id): id is string => id !== null),
            },
          },
        })

        const accountsAndOrganizationVersions = accounts.map((account) => {
          const organizationVersion = organizationVersions.find((org) => org.id === account.organizationVersionId)
          if (!organizationVersion) {
            return { account, organizationVersion: { organizationId: null } }
          }
          return { account, organizationVersion }
        })
        return { user, accounts: accountsAndOrganizationVersions }
      }),
    ]),
  ])

  const [contributor] = await Promise.all([
    prisma.account.create({
      data: {
        organizationVersionId: organizationVersions[0].id,
        role: Role.COLLABORATOR,
        environment: Environment.BC,
        status: UserStatus.ACTIVE,
        userId: (
          await prisma.user.create({
            data: {
              email: 'bc-contributor@yopmail.com',
              firstName: faker.person.firstName(),
              lastName: faker.person.lastName(),
              password: await signPassword('password'),
              level: Level.Initial,
            },
          })
        ).id,
      },
    }),
    prisma.account.create({
      data: {
        organizationVersionId: regularOrganizationVersions[1].id,
        role: Role.DEFAULT,
        environment: Environment.BC,
        status: UserStatus.ACTIVE,
        userId: (
          await prisma.user.create({
            data: {
              email: 'untrained@yopmail.com',
              firstName: faker.person.firstName(),
              lastName: faker.person.lastName(),
              password: await signPassword('password'),
            },
          })
        ).id,
      },
    }),
  ])

  await Promise.all(
    [Role.GESTIONNAIRE, Role.COLLABORATOR].map(async (role) => {
      return prisma.account.create({
        data: {
          organizationVersionId: regularTiltOrganizationVersions[0].id,
          role,
          environment: Environment.TILT,
          status: UserStatus.ACTIVE,
          userId: (
            await prisma.user.create({
              data: {
                email: `tilt-env-untrained-${role.toLowerCase()}-0@yopmail.com`,
                firstName: faker.person.firstName(),
                lastName: faker.person.lastName(),
                password: await signPassword('password-0'),
              },
            })
          ).id,
        },
      })
    }),
  )

  await prisma.user
    .create({
      data: {
        email: 'imported@yopmail.com',
        firstName: 'User',
        lastName: 'Imported',
        level: Level.Initial,
      },
    })
    .then(async (user) => {
      await prisma.account.create({
        data: {
          environment: Environment.BC,
          organizationVersionId: regularOrganizationVersions[0].id,
          role: Role.COLLABORATOR,
          userId: user.id,
          status: UserStatus.IMPORTED,
        },
      })
    })

  const activeAccounts = await prisma.account.findMany({
    where: { status: UserStatus.ACTIVE },
    select: { id: true, environment: true },
  })
  await prisma.userCheckedStep.createMany({
    data: activeAccounts
      .filter((account) => environmentsWithChecklist.includes(account.environment))
      .map((account) => ({ accountId: account.id, step: UserChecklist.CreateAccount })),
  })

  const subPosts = Object.keys(SubPost)
  const creator = faker.helpers.arrayElement(
    usersWithAccounts.filter((userWithAccount) => userWithAccount.accounts[0].account.status === UserStatus.ACTIVE),
  )
  const studies = await Promise.all(
    Array.from({ length: 20 }).map(() => {
      const organizationVersionSites = sites.filter(
        (site) => site.organizationId === creator.accounts[0].organizationVersion.organizationId,
      )
      return prisma.study.create({
        include: { sites: true },
        data: {
          createdById: creator.accounts[0].account.id,
          startDate: new Date(),
          endDate: faker.date.future(),
          isPublic: faker.datatype.boolean(),
          level: faker.helpers.arrayElement(getAllowedLevels(creator.user.level)),
          name: faker.lorem.words({ min: 2, max: 5 }),
          organizationVersionId: creator.accounts[0].account.organizationVersionId as string,
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
            create: { role: StudyRole.Validator, accountId: creator.accounts[0].account.id },
          },
        },
      })
    }),
  )

  await Promise.all(
    regularTiltOrganizationVersions.map(async (organizationVersion) => {
      const organizationVersionSites = sites.filter(
        (site) => site.organizationId === organizationVersion.organizationId,
      )
      const tiltAccount = usersWithAccounts.find((userWithAccount) =>
        userWithAccount.accounts.some(
          (account) =>
            account.organizationVersion.organizationId === organizationVersion.organizationId &&
            account.account.environment === Environment.TILT &&
            account.account.status === UserStatus.ACTIVE,
        ),
      )
      if (!tiltAccount) {
        return
      }
      await prisma.study.create({
        include: { sites: true },
        data: {
          createdById: tiltAccount.accounts[0].account.id,
          startDate: new Date(),
          endDate: faker.date.future(),
          isPublic: true,
          level: Level.Initial,
          name: faker.lorem.words({ min: 2, max: 5 }),
          organizationVersionId: organizationVersion.id,
          simplified: true,
          sites: {
            createMany: {
              data: organizationVersionSites.map((site) => ({
                siteId: site.id,
                etp: 10,
                ca: 10,
              })),
            },
          },
        },
      })
    }),
  )

  const defaultUserWithAccount = usersWithAccounts.find(
    (userWithAccount) => userWithAccount.user.email === 'bc-collaborator-0@yopmail.com',
  ) as userAndAccountsAndOrganizationVersion
  const readerWithAccount = usersWithAccounts.find(
    (userWithAccount) => userWithAccount.user.email === 'bc-collaborator-1@yopmail.com',
  ) as userAndAccountsAndOrganizationVersion
  const editorWithAccount = usersWithAccounts.find(
    (userWithAccount) => userWithAccount.user.email === 'bc-gestionnaire-0@yopmail.com',
  ) as userAndAccountsAndOrganizationVersion

  if (!defaultUserWithAccount.accounts[0].account.organizationVersionId) {
    return null
  }
  const defaultUserWithAccountOrganizationVersion = await prisma.organizationVersion.findFirst({
    where: { id: defaultUserWithAccount.accounts[0].account.organizationVersionId },
  })
  if (!defaultUserWithAccountOrganizationVersion) {
    return null
  }
  const organizationVersionSites = sites.filter(
    (site) => site.organizationId === defaultUserWithAccountOrganizationVersion.organizationId,
  )

  // e2e emission factor
  await prisma.emissionFactor.create({
    data: {
      importedFrom: Import.Manual,
      status: EmissionFactorStatus.Valid,
      totalCo2: 81,
      geographicRepresentativeness: 5,
      completeness: 5,
      reliability: 5,
      technicalRepresentativeness: 5,
      temporalRepresentativeness: 5,
      importedId: '4',
      unit: Unit.GWH,
      isMonetary: false,
      source: 'Magic',
      subPosts: [SubPost.Electricite],
      organizationId: defaultUserWithAccount.accounts[0].organizationVersion.organizationId,
      emissionFactorParts: {
        create: [
          {
            co2f: 1,
            ch4f: 2,
            ch4b: 3,
            n2o: 4,
            co2b: 5,
            sf6: 6,
            hfc: 7,
            pfc: 8,
            otherGES: 9,
            type: 'Amont',
            totalCo2: 45,
            createdAt: new Date('2025-01-01 07:00:00.00'),
            metaData: {
              create: {
                language: 'fr',
                title: 'My first part',
              },
            },
          },
          {
            co2f: 2,
            ch4f: 3,
            ch4b: 4,
            n2o: 5,
            co2b: 6,
            sf6: 7,
            hfc: 8,
            pfc: 9,
            otherGES: 10,
            type: 'Combustion',
            totalCo2: 54,
            createdAt: new Date('2025-01-01 08:00:00.00'),
            metaData: {
              create: {
                language: 'fr',
                title: 'My second part',
              },
            },
          },
        ],
      },
      metaData: {
        create: {
          language: 'fr',
          title: 'My FE to edit',
        },
      },
    },
  })

  studies.push(
    await prisma.study.create({
      include: { sites: true },
      data: {
        id: '88c93e88-7c80-4be4-905b-f0bbd2ccc779',
        createdById: defaultUserWithAccount.accounts[0].account.id,
        startDate: new Date(),
        endDate: faker.date.future(),
        isPublic: false,
        level: faker.helpers.enumValue(Level),
        name: faker.lorem.words({ min: 2, max: 5 }),
        organizationVersionId: defaultUserWithAccount.accounts[0].account.organizationVersionId as string,
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
              { role: StudyRole.Validator, accountId: defaultUserWithAccount.accounts[0].account.id },
              { role: StudyRole.Reader, accountId: readerWithAccount.accounts[0].account.id },
              { role: StudyRole.Editor, accountId: editorWithAccount.accounts[0].account.id },
            ],
          },
        },
        contributors: {
          create: { accountId: contributor.id, subPost: SubPost.MetauxPlastiquesEtVerre },
        },
        tagFamilies: {
          create: [
            {
              name: 'défaut',
              tags: {
                create: (DefaultStudyTags[Environment.TILT] ?? []).map((tag) => ({
                  name: tag.name,
                  color: tag.color,
                })),
              },
            },
          ],
        },
      },
    }),
  )

  studies.push(
    await prisma.study.create({
      include: { sites: true },
      data: {
        id: '88c93e88-7c80-4be4-905b-f0bbd2ccc840',
        createdById: defaultUserWithAccount.accounts[0].account.id,
        startDate: new Date(),
        endDate: faker.date.future(),
        isPublic: false,
        level: Level.Initial,
        name: 'Study to delete',
        organizationVersionId: defaultUserWithAccount.accounts[0].account.organizationVersionId as string,
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
            data: [{ role: StudyRole.Validator, accountId: defaultUserWithAccount.accounts[0].account.id }],
          },
        },
        tagFamilies: {
          create: [
            {
              name: 'défaut',
              tags: {
                create: (DefaultStudyTags[Environment.TILT] ?? []).map((tag) => ({
                  name: tag.name,
                  color: tag.color,
                })),
              },
            },
          ],
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

  await createRealStudy(prisma, defaultUserWithAccount.accounts[0].account)
}

const actualities = async () => {
  await prisma.actuality.deleteMany()
  await prisma.actuality.createMany({ data: ACTUALITIES })
}

const main = async (params: Params) => {
  await Promise.all([actualities(), users(), reCreateBegesRules()])
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

if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
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
