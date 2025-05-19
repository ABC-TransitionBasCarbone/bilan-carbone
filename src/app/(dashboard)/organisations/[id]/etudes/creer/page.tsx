import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import NewStudyPage from '@/components/pages/NewStudy'
import NotFound from '@/components/pages/NotFound'
import { getAccountOrganizationVersions } from '@/db/account'
import { getOrganizationVersionAccounts } from '@/db/organization'
import { getUserSettings } from '@/services/serverFunctions/user'
import { defaultCAUnit } from '@/utils/number'
interface Props {
  params: Promise<{ id: string }>
}

const NewStudyInOrganization = async (props: Props & UserSessionProps) => {
  const params = await props.params

  const id = params.id
  if (!id || !props.user.organizationVersionId || !props.user.level) {
    return <NotFound />
  }

  const [organizationVersions, accounts] = await Promise.all([
    getAccountOrganizationVersions(props.user.accountId),
    getOrganizationVersionAccounts(props.user.organizationVersionId),
  ])

  const caUnit = (await getUserSettings())?.caUnit || defaultCAUnit

  return (
    <NewStudyPage
      organizationVersions={organizationVersions}
      user={props.user}
      accounts={accounts}
      defaultOrganizationVersion={organizationVersions.find((organizationVersion) => organizationVersion.id === id)}
      caUnit={caUnit}
    />
  )
}

export default withAuth(NewStudyInOrganization)
