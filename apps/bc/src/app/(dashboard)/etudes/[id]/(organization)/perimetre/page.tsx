import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import withStudyDetails, { StudyProps } from '@/components/hoc/withStudyDetails'
import StudyPerimeterPage from '@/components/pages/StudyPerimeter'
import { getOrganizationVersionWithSitesById } from '@/db/organization'

const StudyPerimeter = async ({ user, study }: StudyProps & UserSessionProps) => {
  const organizationVersion = await getOrganizationVersionWithSitesById(study.organizationVersionId)
  if (!organizationVersion) {
    return null
  }
  return <StudyPerimeterPage study={study} user={user} organizationVersion={organizationVersion} />
}

export default withAuth(withStudyDetails(StudyPerimeter))
