'use server'
import { Level, Prisma, Role, UserSource, UserStatus } from '@prisma/client'
import {
  createOrUpdateOrganization,
  getRawOrganizationById,
  getRawOrganizationBySiret,
} from '../../db/organizationImport'
import { createUsers, getUserByEmail, updateUser } from '../../db/userImport'

const processUser = async (value: Record<string, string>, importedFileDate: Date) => {
  const {
    User_Email: email,
    Firstname: firstName = '',
    Lastname: lastName = '',
    Session_Code: sessionCodeTraining,
    Company_Name: name,
    SIRET: siret,
    SIREN: siren,
    Purchased_Products: purchasedProducts,
    Membership_Year: membershipYear,
    User_Source: source,
  } = value

  const siretOrSiren = siret || siren
  const isCR = ['adhesion_conseil', 'licence_exploitation'].includes(purchasedProducts)
  const activatedLicence = membershipYear.includes(new Date().getFullYear().toString())

  const dbUser = await getUserByEmail(email)

  const user: Prisma.UserCreateManyInput = {
    id: dbUser?.id,
    email,
    firstName,
    lastName,
    role: Role.COLLABORATOR,
    status: UserStatus.IMPORTED,
    importedFileDate,
    source: source as UserSource,
  }

  if (sessionCodeTraining) {
    user.level = sessionCodeTraining.includes('BCM2') ? Level.Advanced : Level.Initial
  }

  if (siretOrSiren) {
    let organization = dbUser?.organizationId
      ? await getRawOrganizationById(dbUser.organizationId)
      : await getRawOrganizationBySiret(siretOrSiren)

    organization = await createOrUpdateOrganization(
      {
        id: organization?.id,
        name,
        siret: siretOrSiren,
      } as Prisma.OrganizationCreateInput,
      isCR,
      activatedLicence,
      importedFileDate,
    )

    user.organizationId = organization?.id
  }

  if (dbUser) {
    await updateUser(dbUser.id || '', {
      level: user.level,
      ...(dbUser.status === UserStatus.IMPORTED && {
        role: user.role as Exclude<Role, 'SUPER_ADMIN'>,
        organizationId: user.organizationId,
      }),
    })
    console.log(`Updating ${email} because already exists`)
    return null
  }

  return user
}

export const processUsers = async (values: Record<string, string>[], importedFileDate: Date) => {
  const users: Prisma.UserCreateManyInput[] = []
  for (let i = 0; i < values.length; i++) {
    const user = await processUser(values[i] as Record<string, string>, importedFileDate)
    if (user) {
      users.push(user)
    }
    if (i % 50 === 0) {
      console.log(`${i}/${values.length}`)
    }
  }
  const created = await createUsers(users)
  console.log(`${created.count} users created`)
}
