import withAuth from '@/components/hoc/withAuth'
import NewEmissionFactorPage from '@/components/pages/NewEmissionFactor'
import NotFound from '@/components/pages/NotFound'
import { Environment } from '@prisma/client'
import { UserSession } from 'next-auth'

interface Props {
  user: UserSession
}

const NewEmissionFactor = async ({ user }: Props) => {
  if (!user.organizationVersionId || !(user.environment === Environment.BC)) {
    return <NotFound />
  }
  return <NewEmissionFactorPage />
}

export default withAuth(NewEmissionFactor)
