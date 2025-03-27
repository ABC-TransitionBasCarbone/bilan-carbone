import withAuth, { AccountProps } from '@/components/hoc/withAuth'
import { StudyProps } from '@/components/hoc/withStudy'
import withStudyDetails from '@/components/hoc/withStudyDetails'
import StudyPerimeterPage from '@/components/pages/StudyPerimeter'
import { getAccountOrganizations } from '@/db/account'

const StudyPerimeter = async ({ user, study }: StudyProps & AccountProps) => {
  const organizations = await getAccountOrganizations(user.accountId)
  return <StudyPerimeterPage study={study} user={user} organization={organizations[0]} />
}

export default withAuth(withStudyDetails(StudyPerimeter))
