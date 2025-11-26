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
  } = value

  const environment = (dataEnvironment || Environment.BC) as Environment

  const email = value['User_Email'].replace(/ /g, '').toLowerCase()

  const companyNumber = siret || siren || vat || taxNumber
  const isCR = ['adhesion_conseil', 'licence_exploitation'].includes(purchasedProducts)
  const activatedLicence = membershipYear.replace(/[{}]/g, '').split(';').map(Number)

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
  const usersWithAccount: (Prisma.UserCreateManyInput & { account: Prisma.AccountCreateInput })[] = []
  for (let i = 0; i < values.length; i++) {
    const userWithAccount = await processUser(values[i] as Record<string, string>, importedFileDate)
    if (userWithAccount) {
      usersWithAccount.push(userWithAccount)
    }
    if (i % 50 === 0) {
      console.log(`${i}/${values.length}`)
    }
  }
  const { newUsers, newAccounts } = await createUsersWithAccount(usersWithAccount)
  console.log(`${newUsers.count} users created`)
  console.log(`${newAccounts.count} accounts created`)
}
