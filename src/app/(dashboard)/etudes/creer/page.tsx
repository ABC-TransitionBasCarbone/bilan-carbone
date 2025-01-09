import withAuth, { UserProps } from '@/components/hoc/withAuth'
import NewStudyPage from '@/components/pages/NewStudy'
import { getOrganizationUsers } from '@/db/organization'
import { getUserOrganizations } from '@/db/user'

const NewStudy = async ({ user }: UserProps) => {
  if (!user.organizationId) {
    return null
  }

  const [organizations, users] = await Promise.all([
    getUserOrganizations(user.email),
    getOrganizationUsers(user.organizationId),
  ])

  return <NewStudyPage organizations={organizations} user={user} usersEmail={users.map((user) => user.email)} />
}

export default withAuth(NewStudy)
