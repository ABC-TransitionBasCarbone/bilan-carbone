import withAuth, { UserProps } from '@/components/hoc/withAuth'
import NewStudyPage from '@/components/pages/NewStudy'
import { getOrganizationUsers } from '@/db/organization'
import { getUserOrganizations } from '@/db/user'

const NewStudy = async (props: UserProps) => {
  if (!props.user.organizationId) {
    return null
  }

  const [organizations, users] = await Promise.all([
    getUserOrganizations(props.user.email),
    getOrganizationUsers(props.user.organizationId),
  ])

  return <NewStudyPage organizations={organizations} user={props.user} usersEmail={users.map((user) => user.email)} />
}

export default withAuth(NewStudy)
