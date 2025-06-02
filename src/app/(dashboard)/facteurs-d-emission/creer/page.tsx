import withAuth from '@/components/hoc/withAuth'
import NewEmissionFactorPage from '@/components/pages/NewEmissionFactor'
import NotFound from '@/components/pages/NotFound'
import { hasAccessToEmissionFactor } from '@/utils/permissions'
import { UserSession } from 'next-auth'

interface Props {
  user: UserSession
}

const NewEmissionFactor = async ({ user }: Props) => {
  if (!user.organizationVersionId || !hasAccessToEmissionFactor(user.environment)) {
    return <NotFound />
  }
  return <NewEmissionFactorPage />
}

export default withAuth(NewEmissionFactor)
