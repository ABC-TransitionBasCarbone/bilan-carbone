import withAuth from '@/components/hoc/withAuth'
import RessourcesPage from '@/components/pages/Ressources'
import { auth } from '@/services/auth.server'
import NotFound from '@abc-transitionbascarbone/common/components/pages/NotFound'

const Ressources = async () => {
  const session = await auth()
  if (!session) {
    return <NotFound />
  }
  return <RessourcesPage environment={session.user.environment} />
}

export default withAuth(Ressources)
