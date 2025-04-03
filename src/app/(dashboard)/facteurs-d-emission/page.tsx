import withAuth from '@/components/hoc/withAuth'
import EmissionsFactorPage from '@/components/pages/EmissionFactors'
import { Account } from 'next-auth'

interface Props {
  user: Account
}

const EmissionFactors = async ({ user }: Props) => {
  return <EmissionsFactorPage userOrganizationId={user.organizationId} />
}

export default withAuth(EmissionFactors)
