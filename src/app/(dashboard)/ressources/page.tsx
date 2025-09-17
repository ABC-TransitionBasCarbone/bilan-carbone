'use server'

import withAuth from '@/components/hoc/withAuth'
import NotFound from '@/components/pages/NotFound'
import RessourcesPage from '@/components/pages/Ressources'
import { auth } from '@/services/auth'

const Ressources = async () => {
  const session = await auth()
  if (!session) {
    return <NotFound />
  }
  return <RessourcesPage environment={session.user.environment} />
}

export default withAuth(Ressources)
