import EditOrganizationPage from '@/components/pages/EditOrganization'
import NotFound from '@/components/pages/NotFound'
import { getOrganizationWithSitesById } from '@/db/organization'
import { auth } from '@/services/auth'
import { checkOrganization } from '@/services/permissions/organization'
import { UUID } from 'crypto'

interface Props {
  params: Promise<{ id: UUID }>
}

const OrganizationView = async (props: Props) => {
  const params = await props.params
  const session = await auth()

  const id = params.id
  if (!id || !session || !session.user.organizationId) {
    return <NotFound />
  }

  if (!(await checkOrganization(session.user.organizationId, id))) {
    return <NotFound />
  }

  const organization = await getOrganizationWithSitesById(id)

  if (!organization) {
    return <NotFound />
  }

  return <EditOrganizationPage organization={organization} />
}

export default OrganizationView
