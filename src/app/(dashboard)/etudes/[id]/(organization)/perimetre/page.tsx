import withAuth, { UserProps } from '@/components/hoc/withAuth'
import { StudyProps } from '@/components/hoc/withStudy'
import withStudyDetails from '@/components/hoc/withStudyDetails'
import StudyPerimeterPage from '@/components/pages/StudyPerimeter'
import { getUserOrganizations } from '@/db/user'

const StudyPerimeter = async ({ user, study }: StudyProps & UserProps) => {
  const organizations = await getUserOrganizations(user.email)
  return <StudyPerimeterPage study={study} user={user} organization={organizations[0]} />
}

export default withAuth(withStudyDetails(StudyPerimeter))
