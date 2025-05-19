import withAuth from '@/components/hoc/withAuth'
import NewEmissionFactorPage from '@/components/pages/NewEmissionFactor'
import NotFound from '@/components/pages/NotFound'
import { UserSession } from 'next-auth'

interface Props {
  user: UserSession
}

const NewEmissionFactor = async ({ user }: Props) => {
  if (!user.organizationVersionId) {
    return <NotFound />
  }
  return <NewEmissionFactorPage />
}

export default withAuth(NewEmissionFactor)
