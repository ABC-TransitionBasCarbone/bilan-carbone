import withAuth from '@/components/hoc/withAuth'
import EmissionsFactorPage from '@/components/pages/EmissionFactors'

const EmissionFactors = async () => {
  return <EmissionsFactorPage />
}

export default withAuth(EmissionFactors)
