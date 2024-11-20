import { auth } from '@/services/auth'
import NewOrganizationPage from '@/components/pages/NewOrganization'

const NewOrganization = async () => {
  const session = await auth()
  if (!session) {
    return null
  }

  return <NewOrganizationPage />
}

export default NewOrganization
