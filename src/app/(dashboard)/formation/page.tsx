'use server'

import ForbiddenAccess from '@/components/formation/Forbidden'
import FormationPage from '@/components/pages/Formation'
import NotFound from '@/components/pages/NotFound'
import { getFormationVideos } from '@/db/formation'
import { getOrganizationVersionById } from '@/db/organization'
import { auth } from '@/services/auth'
import { hasAccessToFormation, hasLevelForFormation } from '@/services/permissions/formations'

const Formation = async () => {
  const session = await auth()
  if (!session?.user || !(await hasAccessToFormation(session.user))) {
    return <NotFound />
  }

  if (!(await hasLevelForFormation(session.user))) {
    return <ForbiddenAccess environment={session.user.environment} />
  }

  const organizationVersion = await getOrganizationVersionById(session.user.organizationVersionId)
  const formations = await getFormationVideos()

  return (
    <FormationPage
      formations={formations}
      user={session.user}
      organizationName={organizationVersion?.organization?.name ?? ''}
    />
  )
}

export default Formation
