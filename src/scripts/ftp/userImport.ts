'use server'

import { getAccountByEmailAndEnvironment } from '@/db/account'
import { getOrganizationVersionByOrganizationIdAndEnvironment } from '@/db/organization'
import { createOrUpdateOrganization, getRawOrganizationById, getRawOrganizationBySiret } from '@/db/organizationImport'
import { createUsersWithAccount, updateAccount } from '@/db/userImport'
import { Environment, Level, Prisma, Role, UserSource, UserStatus } from '@prisma/client'

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
    Environment: environment,
  } = value

  const email = value['User_Email'].replace(/ /g, '').toLowerCase()

  const companyNumber = siret || siren || vat || taxNumber
  const isCR = ['adhesion_conseil', 'licence_exploitation'].includes(purchasedProducts)
  const activatedLicence = membershipYear.includes(new Date().getFullYear().toString())

  const dbAccount = await getAccountByEmailAndEnvironment(email, (environment as Environment) || Environment.BC)

  const user: Prisma.UserCreateManyInput & { account: Prisma.AccountCreateInput } = {
    id: dbAccount?.user.id,
    email,
    firstName,
    lastName,
    status: UserStatus.IMPORTED,
    source: source as UserSource,
    account: {
      role: Role.COLLABORATOR,
      importedFileDate,
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
      environment as Environment,
    )

    const organizationVersion = await getOrganizationVersionByOrganizationIdAndEnvironment(
      organization?.id,
      environment as Environment,
    )
    user.account.organizationVersion = organizationVersion ? { connect: { id: organizationVersion.id } } : undefined
  }

  if (dbAccount) {
    await updateAccount(
      dbAccount.id || '',
      {
        ...(dbAccount.user.status === UserStatus.IMPORTED && {
          role: user.account.role as Exclude<Role, 'SUPER_ADMIN'>,
          organizationVersion: user.account.organizationVersion,
        }),
      },
      {
        ...dbAccount.user,
        level: user.level,
      },
    )
    console.log(`Updating ${email} because already exists`)
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
  const created = await createUsersWithAccount(usersWithAccount)
  console.log(`${created.count} users created`)
}
