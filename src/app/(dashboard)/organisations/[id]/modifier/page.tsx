import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import EditOrganizationPage from '@/components/pages/EditOrganization'
import NotFound from '@/components/pages/NotFound'
import { getOrganizationVersionWithSitesById, OrganizationVersionWithOrganization } from '@/db/organization'
import { canEditOrganizationVersion } from '@/utils/organization'
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

  const organizationVersion = (await getOrganizationVersionWithSitesById(id)) as OrganizationVersionWithOrganization
  if (!organizationVersion || !canEditOrganizationVersion(props.user, organizationVersion)) {
    return <NotFound />
  }

  return <EditOrganizationPage organizationVersion={organizationVersion} user={props.user} />
}

export default withAuth(OrganizationView)
