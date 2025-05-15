import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import NotFound from '@/components/pages/NotFound'
import OrganizationPage from '@/components/pages/Organization'
import { getOrganizationVersionWithSitesById, OrganizationVersionWithOrganization } from '@/db/organization'
import { isInOrgaOrParent } from '@/utils/organization'
import { UUID } from 'crypto'

interface Props {
  params: Promise<{ id: UUID }>
}

const OrganizationView = async (props: Props & UserSessionProps) => {
  const params = await props.params

  const id = params.id
  if (!id || !props.user.organizationVersionId) {
    return <NotFound />
  }

  const organizationVersion = await getOrganizationVersionWithSitesById(id)
  if (
    !organizationVersion ||
    !isInOrgaOrParent(props.user?.organizationVersionId, organizationVersion as OrganizationVersionWithOrganization)
  ) {
    return <NotFound />
  }

  return <OrganizationPage user={props.user} organizationVersion={organizationVersion} />
}

export default withAuth(OrganizationView)
