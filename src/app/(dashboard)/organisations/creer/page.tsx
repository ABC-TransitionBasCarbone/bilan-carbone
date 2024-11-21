import { auth } from '@/services/auth'
import NewOrganizationPage from '@/components/pages/NewOrganization'
import NotFound from '@/components/pages/NotFound'

const NewOrganization = async () => {
  const session = await auth()
  if (!session) {
    return <NotFound />
  }

  return <NewOrganizationPage />
}

export default NewOrganization
