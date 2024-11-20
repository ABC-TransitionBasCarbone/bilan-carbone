import { UUID } from 'crypto'
import { auth } from '@/services/auth'
import NotFound from '@/components/pages/NotFound'
import OrganizationPage from '@/components/pages/Organization'
import { checkOrganization } from '@/services/permissions/organization'
import { getOrganizationByIdWithSites } from '@/db/organization'

interface Props {
  params: Promise<{ id: UUID }>
}

const OrganizationView = async (props: Props) => {
  const params = await props.params
  const session = await auth()

  const id = params.id
  if (!id || !session) {
    return <NotFound />
  }

  if (!(await checkOrganization(session.user.organizationId, id))) {
    return <NotFound />
  }

  const organization = await getOrganizationByIdWithSites(id)

  if (!organization) {
    return <NotFound />
  }

  return <OrganizationPage user={session.user} organizations={[organization]} />
}

export default OrganizationView
