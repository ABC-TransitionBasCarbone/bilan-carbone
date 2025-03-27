import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import NewStudyPage from '@/components/pages/NewStudy'
import NotFound from '@/components/pages/NotFound'
import { getAccountOrganizations } from '@/db/account'
import { getOrganizationAccounts } from '@/db/organization'
import { getUserSettings } from '@/services/serverFunctions/user'
import { defaultCAUnit } from '@/utils/number'

const NewStudy = async ({ user }: UserSessionProps) => {
  if (!user.organizationId || !user.level) {
    return <NotFound />
  }

  const [organizations, accounts] = await Promise.all([
    getAccountOrganizations(user.accountId),
    getOrganizationAccounts(user.organizationId),
  ])

  const caUnit = (await getUserSettings())?.caUnit || defaultCAUnit

  return <NewStudyPage organizations={organizations} user={user} accounts={accounts} caUnit={caUnit} />
}

export default withAuth(NewStudy)
