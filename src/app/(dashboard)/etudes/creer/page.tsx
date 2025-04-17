import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import NewStudyPage from '@/components/pages/NewStudy'
import NotFound from '@/components/pages/NotFound'
import { getAccountOrganizationVersions } from '@/db/account'
import { getOrganizationVersionAccounts } from '@/db/organization'
import { getUserSettings } from '@/services/serverFunctions/user'
import { CA_UNIT_VALUES, defaultCAUnit } from '@/utils/number'

const NewStudy = async ({ user }: UserSessionProps) => {
  if (!user.organizationVersionId || !user.level) {
    return <NotFound />
  }

  const [organizationVersions, accounts] = await Promise.all([
    getAccountOrganizationVersions(user.accountId),
    getOrganizationVersionAccounts(user.organizationVersionId),
  ])

  const userCAUnit = (await getUserSettings())?.caUnit
  const caUnit = userCAUnit ? CA_UNIT_VALUES[userCAUnit] : defaultCAUnit

  return <NewStudyPage organizationVersions={organizationVersions} user={user} accounts={accounts} caUnit={caUnit} />
}

export default withAuth(NewStudy)
