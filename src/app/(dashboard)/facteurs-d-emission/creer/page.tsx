import withAuth from '@/components/hoc/withAuth'
import NewEmissionFactorPage from '@/components/pages/NewEmissionFactor'

const NewEmissionFactor = async () => {
  return <NewEmissionFactorPage />
}

export default withAuth(NewEmissionFactor)
