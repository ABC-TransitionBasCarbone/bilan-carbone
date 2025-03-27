import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import NewStudyPage from '@/components/pages/NewStudy'
import NotFound from '@/components/pages/NotFound'
import { getAccountOrganizations } from '@/db/account'
import { getOrganizationAccounts } from '@/db/organization'
import { getUserSettings } from '@/services/serverFunctions/user'
import { defaultCAUnit } from '@/utils/number'
interface Props {
  params: Promise<{ id: string }>
}

const NewStudyInOrganization = async (props: Props & UserSessionProps) => {
  const params = await props.params

  const id = params.id
  if (!id || !props.user.organizationId || !props.user.level) {
    return <NotFound />
  }

  const [organizations, accounts] = await Promise.all([
    getAccountOrganizations(props.user.accountId),
    getOrganizationAccounts(props.user.organizationId),
  ])

  const caUnit = (await getUserSettings())?.caUnit || defaultCAUnit

  return (
    <NewStudyPage
      organizations={organizations}
      user={props.user}
      accounts={accounts}
      defaultOrganization={organizations.find((organization) => organization.id === id)}
      caUnit={caUnit}
    />
  )
}

export default withAuth(NewStudyInOrganization)
