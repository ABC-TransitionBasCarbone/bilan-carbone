'use server'

import ForbiddenAccess from '@/components/formation/Forbidden'
import FormationPage from '@/components/pages/Formation'
import NotFound from '@/components/pages/NotFound'
import { getFormationVideos } from '@/db/formation'
import { getOrganizationVersionById } from '@/db/organization'
import { auth } from '@/services/auth'
import { hasAccessToFormation } from '@/services/permissions/formations'

const Formation = async () => {
  const session = await auth()
  if (!session?.user) {
    return <NotFound />
  }

  if (!(await hasAccessToFormation(session.user))) {
    return <ForbiddenAccess />
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
