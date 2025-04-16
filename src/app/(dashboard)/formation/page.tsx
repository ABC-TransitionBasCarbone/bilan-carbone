'use server'

import FormationPage from '@/components/pages/Formation'
import NotFound from '@/components/pages/NotFound'
import { getFormationVideos } from '@/db/formation'
import { getOrganizationById } from '@/db/organization'
import { auth } from '@/services/auth'
import { hasAccessToFormation } from '@/services/permissions/formations'

const Formation = async () => {
  const session = await auth()
  if (!session?.user || !(await hasAccessToFormation(session.user))) {
    return <NotFound />
  }

  const organisation = await getOrganizationById(session.user.organizationId)
  const formations = await getFormationVideos()

  return <FormationPage formations={formations} user={session.user} organisationName={organisation?.name ?? ''} />
}

export default Formation
