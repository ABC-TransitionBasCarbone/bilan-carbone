import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import EditOrganizationPage from '@/components/pages/EditOrganization'
import NotFound from '@/components/pages/NotFound'
import { getOrganizationVersionWithSitesById, OrganizationVersionWithOrganization } from '@/db/organization'
import { hasAlwaysAccessToOrganizationVersion } from '@/services/permissions/environment'
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
  const canEditOrganization = canEditOrganizationVersion(props.user, organizationVersion)
  if (!organizationVersion || (!canEditOrganization && !hasAlwaysAccessToOrganizationVersion(props.user.environment))) {
    return <NotFound />
  }

  return (
    <EditOrganizationPage organizationVersion={organizationVersion} user={props.user} disabled={!canEditOrganization} />
  )
}

export default withAuth(OrganizationView)
