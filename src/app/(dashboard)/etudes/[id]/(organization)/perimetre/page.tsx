import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import { StudyProps } from '@/components/hoc/withStudy'
import withStudyDetails from '@/components/hoc/withStudyDetails'
import StudyPerimeterPage from '@/components/pages/StudyPerimeter'
import { getOrganizationWithSitesById } from '@/db/organization'

const StudyPerimeter = async ({ user, study }: StudyProps & UserSessionProps) => {
  const organization = await getOrganizationWithSitesById(study.organizationId)
  if (!organization) {
    return null
  }
  return <StudyPerimeterPage study={study} user={user} organization={organization} />
}

export default withAuth(withStudyDetails(StudyPerimeter))
