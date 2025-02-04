import withAuth, { UserProps } from '@/components/hoc/withAuth'
import OrganizationPage from '@/components/pages/Organization'
import { getUserOrganizations } from '@/db/user'

const Organisation = async ({ user }: UserProps) => {
  const organizations = await getUserOrganizations(user.email)

  return <OrganizationPage organizations={organizations} user={user} />
}

export default withAuth(Organisation)
