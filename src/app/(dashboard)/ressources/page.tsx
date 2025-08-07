import withAuth from '@/components/hoc/withAuth'
import RessourcesPage from '@/components/pages/Ressources'

const Ressources = async () => {
  return <RessourcesPage />
}

export default withAuth(Ressources)
