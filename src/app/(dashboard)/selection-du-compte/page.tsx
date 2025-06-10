'use server'

import NotFound from '@/components/pages/NotFound'
import SelectAccountPage from '@/components/pages/SelectAccount'
import { getUserWithAccountsAndOrganizationsById } from '@/db/user'
import { auth } from '@/services/auth'

const SelectAccount = async () => {
  const session = await auth()
  if (!session || !session.user) {
    return <NotFound />
  }
  const userWithAccountsAndOrganizations = await getUserWithAccountsAndOrganizationsById(session.user.userId)

  return <SelectAccountPage user={session.user} userWithAccountsAndOrganizations={userWithAccountsAndOrganizations} />
}

export default SelectAccount
