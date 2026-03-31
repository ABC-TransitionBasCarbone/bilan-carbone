'use server'

import { getAccountByEmailAndEnvironment } from '@/db/account'
import {
  createOrUpdateOrganization,
  getOrganizationVersionByOrganizationIdAndEnvironment,
  getRawOrganizationById,
  getRawOrganizationBySiret,
} from '@/db/organization'
import { createUsersWithAccount, updateAccount } from '@/db/user'
import { Environment, Level, Prisma, Role, UserSource, UserStatus } from '@prisma/client'
import { getCutRoleFromBase } from '../../../prisma/seed/utils'

type Training = {
  idTrainingType: number
  organismeFormation: string
  formationName: string
  sessionStartDate: string
  sessionEndDate: string
  expirationDate: string
}

const processUser = async (value: Record<string, string>, importedFileDate: Date) => {
  const {
    Firstname: firstName = '',
    Lastname: lastName = '',
    Session_Code: sessionCodeTraining,
    Company_Name: name,
    SIRET: siret,
    SIREN: siren,
    VAT: vat,
    Tax_Number: taxNumber,
    Purchased_Products: purchasedProducts,
    Membership_Year: membershipYear,
    User_Source: source,
    Environment: dataEnvironment,
    Formation_Name: formationName,
    Formation_Start_Date: formationStartDate,
    Formation_End_Date: formationEndDate,
    trainings: rawTrainings,
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

  const email = value['User_Email'].replace(/ /g, '').toLowerCase()

  const companyNumber = siret || siren || vat || taxNumber
  const isCR = ['adhesion_conseil', 'licence_exploitation'].includes(purchasedProducts)
  const activatedLicence = membershipYear.match(/\d{4}/g)?.map(Number)

  const dbAccount = await getAccountByEmailAndEnvironment(email, environment)

  const role = environment === Environment.CUT ? getCutRoleFromBase(Role.COLLABORATOR) : Role.COLLABORATOR

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

  if (sessionCodeTraining) {
    user.level = sessionCodeTraining.includes('BCM2') ? Level.Advanced : Level.Initial
  }

  if (trainings) {
    user.account.formationName = trainings.map((t) => t.formationName).join(' | ')
    user.account.formationStartDate = trainings.map((t) => t.sessionStartDate).join(' | ')
    user.account.formationEndDate = trainings.map((t) => t.sessionEndDate).join(' | ')

    const computedLevel = getUserLevel(trainings)
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
        name,
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

export const processUsers = async (values: Record<string, string>[], importedFileDate: Date) => {
  const BATCH_SIZE = 20
  const usersWithAccount: (Prisma.UserCreateManyInput & { account: Prisma.AccountCreateInput })[] = []

  for (let i = 0; i < values.length; i += BATCH_SIZE) {
    const batch = values.slice(i, i + BATCH_SIZE)
    const results = await Promise.all(batch.map((v) => processUser(v as Record<string, string>, importedFileDate)))
    for (const userWithAccount of results) {
      if (userWithAccount) {
        usersWithAccount.push(userWithAccount)
      }
    }
    if (i % (BATCH_SIZE * 5) === 0 || i + BATCH_SIZE >= values.length) {
      console.log(`Progress: ${Math.min(i + BATCH_SIZE, values.length)}/${values.length}`)
    }
  }
  if (usersWithAccount.length > 0) {
    const { newUsers, newAccounts } = await createUsersWithAccount(usersWithAccount)
    console.log(`${newUsers.count} users created`)
    console.log(`${newAccounts.count} accounts created`)
  } else {
    console.log('No new users to create')
  }
}

const getUserLevel = (trainings: Training[]): Level | undefined => {
  // Retrieve all relevant trainings
  const formationNames = trainings.map((t) => t.formationName)
  // Find the first session date to determine the year
  const firstSessionYear = trainings
    .map((t) => t.sessionStartDate)
    .map((d) => Number(d?.slice(0, 4)))
    .filter((y) => !isNaN(y))
    .sort()[0]

  const initial2026 = [
    'Bilan Carbone® Découverte',
    'Bilan Carbone® Initiation',
  ]
  const initialBefore2026 = [
    'Bilan Carbone® Initiation',
    'MAJ Bilan Carbone® 2025 - Initiation',
  ]
  const advanced2026 = [
    'Bilan Carbone® Maitrise',
    'Bilan Carbone® Professionnel',
  ]
  const advancedBefore2026 = [
    'Bilan Carbone® Maitrise',
    'MAJ Bilan Carbone® 2025 - Maitrise',
  ]

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
