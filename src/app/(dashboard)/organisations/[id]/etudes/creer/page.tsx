import withAuth, { UserProps } from '@/components/hoc/withAuth'
import NewStudyPage from '@/components/pages/NewStudy'
import NotFound from '@/components/pages/NotFound'
import { getOrganizationUsers } from '@/db/organization'
import { getUserOrganizations } from '@/db/user'
interface Props {
  params: Promise<{ id: string }>
}

const NewStudyInOrganization = async (props: Props & UserProps) => {
  const params = await props.params

  const id = params.id
  if (!id || !props.user.organizationId) {
    return <NotFound />
  }

  const [organizations, users] = await Promise.all([
    getUserOrganizations(props.user.email),
    getOrganizationUsers(props.user.organizationId),
  ])

  return (
    <NewStudyPage
      organizations={organizations}
      user={props.user}
      usersEmail={users.map((user) => user.email)}
      defaultOrganization={organizations.find((organization) => organization.id === id)}
    />
  )
}

export default withAuth(NewStudyInOrganization)
