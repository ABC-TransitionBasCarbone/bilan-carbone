import withAuth from '@/components/hoc/withAuth'
import EmissionsFactorPage from '@/components/pages/EmissionFactors'
import { UserSession } from 'next-auth'

interface Props {
  user: UserSession
}

const EmissionFactors = async ({ user }: Props) => {
  return <EmissionsFactorPage userOrganizationId={user.organizationId} />
}

export default withAuth(EmissionFactors)
