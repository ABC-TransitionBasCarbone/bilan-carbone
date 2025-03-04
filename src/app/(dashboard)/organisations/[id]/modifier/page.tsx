import withAuth, { UserProps } from '@/components/hoc/withAuth'
import EditOrganizationPage from '@/components/pages/EditOrganization'
import NotFound from '@/components/pages/NotFound'
import { getOrganizationWithSitesById } from '@/db/organization'
import { isAdmin } from '@/services/permissions/user'
import { isInOrgaOrParent } from '@/utils/onganization'
import { Role } from '@prisma/client'
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

  if (!isAdmin(props.user.role) && props.user.role !== Role.GESTIONNAIRE) {
    return <NotFound />
  }

  const organization = await getOrganizationWithSitesById(id)
  if (!organization || !isInOrgaOrParent(props.user.organizationId, organization)) {
    return <NotFound />
  }

  return <EditOrganizationPage organization={organization} user={props.user} />
}

export default withAuth(OrganizationView)
