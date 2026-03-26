'use server'

import ForbiddenAccess from '@/components/formation/Forbidden'
import FormationPage from '@/components/pages/Formation'
import NotFound from '@/components/pages/NotFound'
import { getFormationVideos } from '@/db/formation'
import { getOrgNameByOrgVersionId } from '@/db/organization'
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

  const organizationName = await getOrgNameByOrgVersionId(session.user.organizationVersionId)
  const formations = await getFormationVideos()

  return <FormationPage formations={formations} user={session.user} organizationName={organizationName ?? ''} />
}

export default Formation
