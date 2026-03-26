import withAuth from '@/components/hoc/withAuth'
import ActualitiesPage from '@/components/pages/Actualities'

const Actualities = async () => {
  return <ActualitiesPage />
}

export default withAuth(Actualities)
