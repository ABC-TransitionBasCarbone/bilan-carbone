'use server'

import { getAccountByEmailAndEnvironment } from '@/db/account'
import {
  createOrUpdateOrganization,
  getOrganizationVersionByOrganizationIdAndEnvironment,
  getRawOrganizationById,
  getRawOrganizationBySiret,
} from '@/db/organization'
import { createUsersWithAccount, organizationVersionActiveAccountsCount, updateAccount } from '@/db/user'
import { Prisma } from '@abc-transitionbascarbone/common/db'
import { Environment, Level, Role, UserSource, UserStatus } from '@abc-transitionbascarbone/common/db/enums'
import { getEnvRoleFromBase } from '../../../prisma/seed/utils'

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

type RawFTPRecord = Record<string, unknown>
type ImportEnvironment = Environment

type ImportedUser = Prisma.UserCreateManyInput & { account: Prisma.AccountCreateInput }
type ExistingAccount = NonNullable<Awaited<ReturnType<typeof getAccountByEmailAndEnvironment>>>
type OrganizationSyncUpdates = Partial<Pick<Prisma.AccountCreateInput, 'organizationVersion'>>

const normalizeRecord = (raw: RawFTPRecord): UserImportRecord => {
  const getString = (camel: string, pascal: string): string | undefined => {
    const val = raw[camel] ?? raw[pascal]
    return typeof val === 'string' ? val : undefined
  }

  return {
    firstName: getString('firstName', 'Firstname'),
    lastName: getString('lastName', 'Lastname'),
    userEmail: getString('userEmail', 'User_Email'),
    purchasedProducts: getString('purchasedProducts', 'Purchased_Products'),
    sessionCode: getString('sessionCode', 'Session_Code'),
    companyName: getString('companyName', 'Company_Name'),
    siret: getString('siret', 'SIRET'),
    siren: getString('siren', 'SIREN'),
    vat: getString('vat', 'VAT'),
    taxNumber: getString('taxNumber', 'Tax_Number'),
    membershipYear: getString('membershipYear', 'Membership_Year'),
    trainings: raw.trainings as Training[] | string | undefined,
    source: getString('source', 'User_Source'),
    environment: getString('environment', 'Environment'),
    formationName: getString('formationName', 'Formation_Name'),
    formationStartDate: getString('formationStartDate', 'Formation_Start_Date'),
    formationEndDate: getString('formationEndDate', 'Formation_End_Date'),
  }
}

const getImportEnvironment = (environment?: string): ImportEnvironment => {
  const normalizedEnvironment = environment || Environment.BC

  if (!Object.values(Environment).includes(normalizedEnvironment as Environment)) {
    throw new Error(`Unsupported FTP environment: ${normalizedEnvironment}`)
  }

  return normalizedEnvironment as Environment
}

const parseTrainings = (rawTrainings: UserImportRecord['trainings']): Training[] => {
  if (Array.isArray(rawTrainings)) {
    return rawTrainings
  }
  if (!rawTrainings) {
    return []
  }

  try {
    return JSON.parse(rawTrainings)
  } catch {
    return []
  }
}

const getDefaultRole = async (
  dbAccount: ExistingAccount | null,
  importedLevel: Level | undefined,
  environment: ImportEnvironment,
) => {
  const defaultRole = environment === Environment.CUT ? getEnvRoleFromBase(Role.COLLABORATOR) : Role.COLLABORATOR

  if (dbAccount?.status !== UserStatus.IMPORTED) {
    return defaultRole
  }
  if (!dbAccount.organizationVersion) {
    return dbAccount.role ?? defaultRole
  }

  const activeAccountsCount = (await organizationVersionActiveAccountsCount(dbAccount.organizationVersion.id)) ?? 0
  if (activeAccountsCount > 0) {
    return dbAccount.role
  }

  const role = importedLevel !== undefined || dbAccount.user.level !== undefined ? Role.ADMIN : Role.GESTIONNAIRE
  return environment === Environment.CUT ? getEnvRoleFromBase(role) : role
}

const getTrainingData = (trainings: Training[]) => {
  if (trainings.length === 0) {
    return undefined
  }

  const highestLevelTraining = trainings.reduce((previous, current) => {
    const previousLevel = getTrainingLevel([previous])
    const currentLevel = getTrainingLevel([current])
    return currentLevel && (!previousLevel || currentLevel > previousLevel) ? current : previous
  }, trainings[0])

  return {
    level: getTrainingLevel([highestLevelTraining]),
    formationName: highestLevelTraining.trainingName,
    formationStartDate: highestLevelTraining.sessionStartDate
      ? new Date(highestLevelTraining.sessionStartDate)
      : undefined,
    formationEndDate: highestLevelTraining.sessionEndDate ? new Date(highestLevelTraining.sessionEndDate) : undefined,
  }
}

type OrganizationSyncInput = {
  dbAccount: ExistingAccount | null
  companyNumber: string | undefined
  companyName: string | undefined
  siret: string | undefined
  isCR: boolean
  activatedLicence: number[] | undefined
  importedFileDate: Date
  environment: ImportEnvironment
}

type UserImportPath = {
  getRole: (
    dbAccount: ExistingAccount | null,
    importedLevel: Level | undefined,
    environment: ImportEnvironment,
  ) => Promise<Role>
  shouldSyncOrganization: (dbAccount: ExistingAccount | null) => boolean
  syncOrganization: (input: OrganizationSyncInput) => Promise<OrganizationSyncUpdates>
}

const updateUserOrganization = async (
  input: OrganizationSyncInput,
  organization: Awaited<ReturnType<typeof getRawOrganizationBySiret>>,
): Promise<OrganizationSyncUpdates> => {
  const { companyNumber, companyName, siret, isCR, activatedLicence, importedFileDate, environment } = input
  if (!companyNumber) {
    return {}
  }

  const updatedOrganization = await createOrUpdateOrganization(
    {
      id: organization?.id,
      name: companyName,
      wordpressId: companyNumber,
      ...(siret && { siret }),
    } as Prisma.OrganizationCreateInput,
    isCR,
    activatedLicence,
    importedFileDate,
    environment,
  )

  const organizationVersion = await getOrganizationVersionByOrganizationIdAndEnvironment(
    updatedOrganization.id,
    environment,
  )
  return { organizationVersion: organizationVersion ? { connect: { id: organizationVersion.id } } : undefined }
}

const syncBCAndTILTUserOrganization = async (input: OrganizationSyncInput): Promise<OrganizationSyncUpdates> => {
  const { dbAccount, companyNumber, environment } = input
  if (!companyNumber) {
    return {}
  }

  const organization = await getRawOrganizationBySiret(companyNumber)
  const existingOrganizationVersion = organization
    ? await getOrganizationVersionByOrganizationIdAndEnvironment(organization.id, environment)
    : null

  if (
    existingOrganizationVersion &&
    ((await organizationVersionActiveAccountsCount(existingOrganizationVersion.id)) ?? 0) > 0
  ) {
    return {}
  }

  return updateUserOrganization(input, organization)
}

const syncUserOrganization = async (input: OrganizationSyncInput): Promise<OrganizationSyncUpdates> => {
  const { dbAccount, companyNumber } = input
  if (!companyNumber) {
    return {}
  }

  const organization = dbAccount?.organizationVersion
    ? await getRawOrganizationById(dbAccount.organizationVersion.organizationId)
    : await getRawOrganizationBySiret(companyNumber)

  return updateUserOrganization(input, organization)
}

const bcAndTiltImportPath: UserImportPath = {
  getRole: async () => Role.DEFAULT,
  shouldSyncOrganization: (dbAccount) =>
    !dbAccount || dbAccount.status === UserStatus.IMPORTED || dbAccount.status === UserStatus.ACTIVE,
  syncOrganization: syncBCAndTILTUserOrganization,
}

const userImportPaths: Partial<Record<ImportEnvironment, UserImportPath>> = {
  [Environment.BC]: bcAndTiltImportPath,
  [Environment.TILT]: bcAndTiltImportPath,
}

const defaultUserImportPath: UserImportPath = {
  getRole: getDefaultRole,
  shouldSyncOrganization: (dbAccount) => !dbAccount || dbAccount.status === UserStatus.IMPORTED,
  syncOrganization: syncUserOrganization,
}

const getImportedAccountUpdates = (user: ImportedUser) => {
  return {
    ...(user.account.formationName !== undefined && { formationName: user.account.formationName }),
    ...(user.account.formationStartDate !== undefined && { formationStartDate: user.account.formationStartDate }),
    ...(user.account.formationEndDate !== undefined && { formationEndDate: user.account.formationEndDate }),
  }
}

const getImportedUserUpdates = (value: UserImportRecord) => {
  return {
    ...(value.firstName && { firstName: value.firstName }),
    ...(value.lastName && { lastName: value.lastName }),
    ...(value.source && { source: value.source as UserSource }),
  }
}

const updateExistingAccount = async (
  dbAccount: ExistingAccount,
  user: ImportedUser,
  value: UserImportRecord,
  environment: ImportEnvironment,
) => {
  const shouldUpdateOrganization =
    dbAccount.status === UserStatus.IMPORTED ||
    (dbAccount.status === UserStatus.ACTIVE && user.account.organizationVersion !== undefined)

  await updateAccount(
    dbAccount.id,
    {
      ...(dbAccount.status === UserStatus.IMPORTED && {
        role: user.account.role as Exclude<Role, 'SUPER_ADMIN'>,
      }),
      ...(shouldUpdateOrganization && {
        organizationVersion: user.account.organizationVersion,
      }),
      environment,
      ...getImportedAccountUpdates(user),
    },
    {
      ...dbAccount.user,
      ...getImportedUserUpdates(value),
      level: user.level,
    },
  )
}

const processUser = async (value: UserImportRecord, importedFileDate: Date) => {
  const trainings = parseTrainings(value.trainings)
  const environment = getImportEnvironment(value.environment)
  const email = (value.userEmail || '').replace(/ /g, '').toLowerCase()
  const companyNumber = value.siret || value.siren || value.vat || value.taxNumber
  const isCR = ['adhesion_conseil', 'licence_exploitation'].includes(value.purchasedProducts ?? '')
  const activatedLicence = (value.membershipYear || '').match(/\d{4}/g)?.map(Number)

  const dbAccount = await getAccountByEmailAndEnvironment(email, environment)
  const importPath = userImportPaths[environment] ?? defaultUserImportPath

  const trainingData = getTrainingData(trainings)
  const sessionLevel = value.sessionCode
    ? value.sessionCode.includes('BCM2') || value.sessionCode.includes('BCM3')
      ? Level.Advanced
      : Level.Initial
    : undefined
  const level = trainingData?.level ?? sessionLevel
  const role = await importPath.getRole(dbAccount, level, environment)

  const account: Prisma.AccountCreateInput = {
    role,
    status: UserStatus.IMPORTED,
    importedFileDate,
    environment,
    formationName: trainingData ? trainingData.formationName : value.formationName,
    formationStartDate: trainingData ? trainingData.formationStartDate : value.formationStartDate,
    formationEndDate: trainingData ? trainingData.formationEndDate : value.formationEndDate,
    user: {
      create: undefined,
      connectOrCreate: undefined,
      connect: undefined,
    },
  }

  let organizationUpdates: OrganizationSyncUpdates = {}
  if (importPath.shouldSyncOrganization(dbAccount)) {
    organizationUpdates = await importPath.syncOrganization({
      dbAccount,
      companyNumber,
      companyName: value.companyName,
      siret: value.siret,
      isCR,
      activatedLicence,
      importedFileDate,
      environment,
    })
  }

  const user: ImportedUser = {
    id: dbAccount?.user.id,
    email,
    firstName: value.firstName || '',
    lastName: value.lastName || '',
    source: value.source as UserSource,
    ...(level !== undefined && { level }),
    account: { ...account, ...organizationUpdates },
  }

  if (dbAccount) {
    await updateExistingAccount(dbAccount, user, value, environment)
    return null
  }

  return user
}

export const processUsers = async (values: RawFTPRecord[], importedFileDate: Date) => {
  const BATCH_SIZE = 20
  const usersWithAccount: (Prisma.UserCreateManyInput & { account: Prisma.AccountCreateInput })[] = []
  let updatedAccountsCount = 0

  for (let i = 0; i < values.length; i += BATCH_SIZE) {
    const batch = values.slice(i, i + BATCH_SIZE)
    const results = await Promise.all(batch.map((v) => processUser(normalizeRecord(v), importedFileDate)))
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

const getTrainingLevel = (trainings: Training[]): Level | undefined => {
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
