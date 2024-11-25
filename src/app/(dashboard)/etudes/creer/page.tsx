import NewStudyPage from '@/components/pages/NewStudy'
import { getOrganizationUsers } from '@/db/organization'
import { getUserOrganizations } from '@/db/user'
import { auth } from '@/services/auth'

const NewStudy = async () => {
  const session = await auth()
  if (!session || !session.user.organizationId) {
    return null
  }

  const [organizations, users] = await Promise.all([
    getUserOrganizations(session.user.email),
    getOrganizationUsers(session.user.organizationId),
  ])

  return <NewStudyPage organizations={organizations} user={session.user} usersEmail={users.map((user) => user.email)} />
}

export default NewStudy
