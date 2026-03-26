import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import NotFound from '@/components/pages/NotFound'
import SimplifiedStudies from '@/components/pages/SimplifiedStudies'
import TiltSimplifiedComingSoon from '@/components/pages/TiltSimplifiedComingSoon'
import { getOrgNameByOrgVersionId } from '@/db/organization'
import { hasAccessToSimplifiedStudies, isTilt, isTiltSimplifiedFeatureActive } from '@/services/permissions/environment'

const MyFootprints = async ({ user }: UserSessionProps) => {
  if (!user.organizationVersionId || !hasAccessToSimplifiedStudies(user.environment)) {
    return <NotFound />
  }

  const organizationName = await getOrgNameByOrgVersionId(user.organizationVersionId)

  if (!organizationName) {
    return <NotFound />
  }

  if (isTilt(user.environment)) {
    const isTiltSimplifiedActive = await isTiltSimplifiedFeatureActive(user.environment)
    if (!isTiltSimplifiedActive) {
      return <TiltSimplifiedComingSoon />
    }
  }

  return (
    <SimplifiedStudies
      organizationVersionId={user.organizationVersionId}
      organizationName={organizationName}
      user={user}
    />
  )
}

export default withAuth(MyFootprints)
