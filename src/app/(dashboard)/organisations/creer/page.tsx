import withAuth from '@/components/hoc/withAuth'
import NewOrganizationPage from '@/components/pages/NewOrganization'

const NewOrganization = async () => {
  return <NewOrganizationPage />
}

export default withAuth(NewOrganization)
