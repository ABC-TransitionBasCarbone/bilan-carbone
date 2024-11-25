import OrganizationPage from '@/components/pages/Organization'
import { getUserOrganizations } from '@/db/user'
import { auth } from '@/services/auth'

const Organisation = async () => {
  const session = await auth()
  if (!session || !session.user) {
    return null
  }
  const organizations = await getUserOrganizations(session.user.email)
  return <OrganizationPage organizations={organizations} user={session.user} />
}

export default Organisation
