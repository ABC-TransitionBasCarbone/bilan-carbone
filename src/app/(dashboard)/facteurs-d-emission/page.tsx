import withAuth from '@/components/hoc/withAuth'
import EmissionsFactorPage from '@/components/pages/EmissionFactors'
import { User } from 'next-auth'

interface Props {
  user: User
}

const EmissionFactors = async ({ user }: Props) => {
  return <EmissionsFactorPage userOrganizationId={user.organizationId} />
}

export default withAuth(EmissionFactors)
