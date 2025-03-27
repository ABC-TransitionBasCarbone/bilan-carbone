import withAuth from '@/components/hoc/withAuth'
import NewEmissionFactorPage from '@/components/pages/NewEmissionFactor'
import NotFound from '@/components/pages/NotFound'
import { Account } from 'next-auth'

interface Props {
  user: Account
}

const NewEmissionFactor = async ({ user }: Props) => {
  if (!user.organizationId) {
    return <NotFound />
  }
  return <NewEmissionFactorPage />
}

export default withAuth(NewEmissionFactor)
