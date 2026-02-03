import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import NotFound from '@/components/pages/NotFound'
import SimplifiedStudies from '@/components/pages/SimplifiedStudies'
import TiltSimplifiedComingSoon from '@/components/pages/TiltSimplifiedComingSoon'
import { getOrganizationVersionById } from '@/db/organization'
import { hasAccessToSimplifiedStudies, isTilt, isTiltSimplifiedFeatureActive } from '@/services/permissions/environment'

const MyFootprints = async ({ user }: UserSessionProps) => {
  if (!user.organizationVersionId || !hasAccessToSimplifiedStudies(user.environment)) {
    return <NotFound />
  }

  const organizationVersion = await getOrganizationVersionById(user.organizationVersionId)

  if (!organizationVersion) {
    return <NotFound />
  }

  if (isTilt(user.environment)) {
    const isTiltSimplifiedActive = await isTiltSimplifiedFeatureActive(user.environment)
    if (!isTiltSimplifiedActive) {
      return <TiltSimplifiedComingSoon />
    }
  }

  return <SimplifiedStudies organizationVersion={organizationVersion} user={user} />
}

export default withAuth(MyFootprints)
