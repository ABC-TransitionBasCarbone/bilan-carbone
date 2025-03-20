import withAuth, { UserProps } from '@/components/hoc/withAuth'
import NotFound from '@/components/pages/NotFound'
import OrganizationPage from '@/components/pages/Organization'
import { getOrganizationWithSitesById } from '@/db/organization'
import { isInOrgaOrParent } from '@/utils/onganization'
import { UUID } from 'crypto'

interface Props {
  params: Promise<{ id: UUID }>
}

const OrganizationView = async (props: Props & UserProps) => {
  const params = await props.params

  const id = params.id
  if (!id || !props.user.organizationId) {
    return <NotFound />
  }

  const organization = await getOrganizationWithSitesById(id)
  if (!organization || !isInOrgaOrParent(props.user.organizationId, organization)) {
    return <NotFound />
  }

  return <OrganizationPage user={props.user} organization={organization} />
}

export default withAuth(OrganizationView)
