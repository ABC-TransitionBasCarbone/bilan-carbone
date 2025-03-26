import withAuth, { UserProps } from '@/components/hoc/withAuth'
import NewStudyPage from '@/components/pages/NewStudy'
import NotFound from '@/components/pages/NotFound'
import { getOrganizationUsers } from '@/db/organization'
import { getUserOrganizations } from '@/db/user'
import { getUserSettings } from '@/services/serverFunctions/userAuth'
import { CA_UNIT_VALUES, defaultCAUnit } from '@/utils/number'
interface Props {
  params: Promise<{ id: string }>
}

const NewStudyInOrganization = async (props: Props & UserProps) => {
  const params = await props.params

  const id = params.id
  if (!id || !props.user.organizationId || !props.user.level) {
    return <NotFound />
  }

  const [organizations, users] = await Promise.all([
    getUserOrganizations(props.user.email),
    getOrganizationUsers(props.user.organizationId),
  ])

  const userCAUnit = (await getUserSettings())?.caUnit
  const caUnit = userCAUnit ? CA_UNIT_VALUES[userCAUnit] : defaultCAUnit

  return (
    <NewStudyPage
      organizations={organizations}
      user={props.user}
      users={users}
      defaultOrganization={organizations.find((organization) => organization.id === id)}
      caUnit={caUnit}
    />
  )
}

export default withAuth(NewStudyInOrganization)
