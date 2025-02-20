import withAuth from '@/components/hoc/withAuth'
import NewEmissionFactorPage from '@/components/pages/NewEmissionFactor'
import NotFound from '@/components/pages/NotFound'
import { User } from '@prisma/client'

interface Props {
  user: User
}

const NewEmissionFactor = async ({ user }: Props) => {
  if (!user.organizationId) {
    return <NotFound />
  }
  return <NewEmissionFactorPage />
}

export default withAuth(NewEmissionFactor)
