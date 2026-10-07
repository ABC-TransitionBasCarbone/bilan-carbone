import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import ActualitiesPage from '@/components/pages/Actualities'

const Actualities = async ({ user }: UserSessionProps) => {
  return <ActualitiesPage environment={user.environment} />
}

export default withAuth(Actualities)
