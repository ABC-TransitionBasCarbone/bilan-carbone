'use server'

import { getAccountByEmailAndEnvironment } from '@/db/account'
import {
  createOrUpdateOrganization,
  getOrganizationVersionByOrganizationIdAndEnvironment,
  getRawOrganizationById,
  getRawOrganizationBySiret,
} from '@/db/organization'
import { createUsersWithAccount, organizationVersionActiveAccountsCount, updateAccount } from '@/db/user'
import { Prisma } from '@repo/db-common'
import { Environment, Level, Role, UserSource, UserStatus } from '@repo/db-common/enums'
import { getCutRoleFromBase } from '../../../prisma/seed/utils'

type Training = {
  trainingTypeId: number
  trainingOrganisation: string
  trainingName: string
  sessionStartDate: string
  sessionEndDate: string
  expirationDate: string
}

type UserImportRecord = {
  firstName?: string
  lastName?: string
  userEmail?: string
  purchasedProducts?: string
  sessionCode?: string
  companyName?: string
  siret?: string
  siren?: string
  vat?: string
  taxNumber?: string
  membershipYear?: string
  trainings?: Training[] | string
  source?: string
  environment?: string
  formationName?: string
  formationStartDate?: string
  formationEndDate?: string
}

const processUser = async (value: UserImportRecord, importedFileDate: Date) => {
  const {
    firstName = '',
    lastName = '',
    userEmail,
    purchasedProducts,
    sessionCode,
    companyName,
    siret,
    siren,
    vat,
    taxNumber,
    membershipYear,
    trainings: rawTrainings,
    source,
    environment: dataEnvironment,
    formationName,
    formationStartDate,
    formationEndDate,
  } = value

  const trainings: Training[] = Array.isArray(rawTrainings)
    ? rawTrainings
    : rawTrainings
      ? (() => {
          try {
            return JSON.parse(rawTrainings)
          } catch {
            return []
          }
        })()
      : []

  const environment = (dataEnvironment || Environment.BC) as Environment

  const email = (userEmail || '').replace(/ /g, '').toLowerCase()

  const companyNumber = siret || siren || vat || taxNumber
  const isCR = ['adhesion_conseil', 'licence_exploitation'].includes(purchasedProducts ?? '')
  const activatedLicence = (membershipYear || '').match(/\d{4}/g)?.map(Number)

  const dbAccount = await getAccountByEmailAndEnvironment(email, environment)

  let role = environment === Environment.CUT ? getCutRoleFromBase(Role.COLLABORATOR) : Role.COLLABORATOR

  // If the user already has an account but is not linked to an organization version, or if they are the last active account of their organization version, they should be set as admin to avoid locking themselves out of their organization
  if (
    dbAccount &&
    dbAccount.user.level !== undefined &&
    ((dbAccount.organizationVersion &&
      ((await organizationVersionActiveAccountsCount(dbAccount.organizationVersion.id)) ?? 0) <= 1) ||
      !dbAccount.organizationVersion)
  ) {
    role = Role.ADMIN
  }

  const user: Prisma.UserCreateManyInput & { account: Prisma.AccountCreateInput } = {
    id: dbAccount?.user.id,
    email,
    firstName,
    lastName,
    source: source as UserSource,
    account: {
      role,
      status: UserStatus.IMPORTED,
      importedFileDate,
      environment,
      formationName,
      formationStartDate,
      formationEndDate,
      user: {
        create: undefined,
        connectOrCreate: undefined,
        connect: undefined,
      },
    },
  }

  if (sessionCode) {
    user.level = sessionCode.includes('BCM2') ? Level.Advanced : Level.Initial
  }

  if (trainings && Array.isArray(trainings) && trainings.length > 0) {
    const highestLevelTraining = trainings.reduce((prev, current) => {
      const prevLevel = getUserLevel([prev])
      const currentLevel = getUserLevel([current])
      return currentLevel && (!prevLevel || currentLevel > prevLevel) ? current : prev
    }, trainings[0])

    user.account.formationName = highestLevelTraining.trainingName
    user.account.formationStartDate = highestLevelTraining.sessionStartDate
      ? new Date(highestLevelTraining.sessionStartDate)
      : undefined
    user.account.formationEndDate = highestLevelTraining.sessionEndDate
      ? new Date(highestLevelTraining.sessionEndDate)
      : undefined

    const computedLevel = getUserLevel([highestLevelTraining])
    if (computedLevel) {
      user.level = computedLevel
    }
  }

  if (companyNumber) {
    let organization = dbAccount?.organizationVersion
      ? await getRawOrganizationById(dbAccount.organizationVersion?.organizationId)
      : await getRawOrganizationBySiret(companyNumber)

    organization = await createOrUpdateOrganization(
      {
        id: organization?.id,
        name: companyName,
        wordpressId: companyNumber,
      } as Prisma.OrganizationCreateInput,
      isCR,
      activatedLicence,
      importedFileDate,
      environment,
    )

    const organizationVersion = await getOrganizationVersionByOrganizationIdAndEnvironment(
      organization?.id,
      environment,
    )
    user.account.organizationVersion = organizationVersion ? { connect: { id: organizationVersion.id } } : undefined
  }

  if (dbAccount) {
    await updateAccount(
      dbAccount.id,
      {
        ...(dbAccount.status === UserStatus.IMPORTED && {
          role: user.account.role as Exclude<Role, 'SUPER_ADMIN'>,
          organizationVersion: user.account?.organizationVersion,
        }),
        environment,
      },
      {
        ...dbAccount.user,
        level: user.level,
      },
    )
    return null
  }

  return user
}

export const processUsers = async (values: UserImportRecord[], importedFileDate: Date) => {
  const BATCH_SIZE = 20
  const usersWithAccount: (Prisma.UserCreateManyInput & { account: Prisma.AccountCreateInput })[] = []
  let updatedAccountsCount = 0

  for (let i = 0; i < values.length; i += BATCH_SIZE) {
    const batch = values.slice(i, i + BATCH_SIZE)
    const results = await Promise.all(batch.map((v) => processUser(v, importedFileDate)))
    for (const userWithAccount of results) {
      if (userWithAccount) {
        usersWithAccount.push(userWithAccount)
      } else {
        updatedAccountsCount += 1
      }
    }
  }
  if (usersWithAccount.length > 0) {
    const { newUsers, newAccounts } = await createUsersWithAccount(usersWithAccount)
    console.log(`${newUsers.count} users created`)
    console.log(`${newAccounts.count} accounts created`)
  } else {
    console.log('No new users to create')
  }
  if (updatedAccountsCount > 0) {
    console.log(`${updatedAccountsCount} accounts updated`)
  }
}

const getUserLevel = (trainings: Training[]): Level | undefined => {
  // Retrieve all relevant trainings
  const formationNames = trainings.map((t) => t.trainingName)
  // Find the first session date to determine the year
  const firstSessionYear = trainings
    .map((t) => t.sessionStartDate)
    .map((d) => Number(d?.slice(0, 4)))
    .filter((y) => !isNaN(y))
    .sort()[0]

  const initial2026 = ['Bilan Carbone® Découverte', 'Bilan Carbone® Initiation']
  const initialBefore2026 = ['Bilan Carbone® Initiation', 'MAJ Bilan Carbone® 2025 - Initiation']
  const advanced2026 = ['Bilan Carbone® Maitrise', 'Bilan Carbone® Professionnel']
  const advancedBefore2026 = ['Bilan Carbone® Maitrise', 'MAJ Bilan Carbone® 2025 - Maitrise']

  const hasAll = (required: string[]) => required.every((f) => formationNames.includes(f))
  const hasOne = (options: string[]) => options.some((f) => formationNames.includes(f))

  if (firstSessionYear && firstSessionYear >= 2026) {
    if (hasOne(initial2026)) {
      return Level.Initial
    }
    if (hasOne(advanced2026)) {
      return Level.Advanced
    }
  } else if (firstSessionYear && firstSessionYear < 2026) {
    if (hasAll(initialBefore2026)) {
      return Level.Initial
    }
    if (hasAll(advancedBefore2026)) {
      return Level.Advanced
    }
  }
  return undefined
}
