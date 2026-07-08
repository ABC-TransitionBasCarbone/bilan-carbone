'use server'

import SelectAccountPage from '@/components/pages/SelectAccount'
import { getUserWithAccountsAndOrganizationsById } from '@/db/user'
import { auth } from '@/services/auth'
import NotFound from '@abc-transitionbascarbone/components/src/pages/NotFound'

const SelectAccount = async () => {
  const session = await auth()
  if (!session || !session.user) {
    return <NotFound />
  }
  const userWithAccountsAndOrganizations = await getUserWithAccountsAndOrganizationsById(session.user.userId)

  return <SelectAccountPage user={session.user} userWithAccountsAndOrganizations={userWithAccountsAndOrganizations} />
}

export default SelectAccount
