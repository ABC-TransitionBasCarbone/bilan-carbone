import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import { StudyProps } from '@/components/hoc/withStudy'
import withStudyDetails from '@/components/hoc/withStudyDetails'
import NotFound from '@/components/pages/NotFound'
import StudyContributionPage from '@/components/pages/StudyContribution'
import { getAccountRoleOnStudy } from '@/utils/study'

const DataEntry = async ({ study, user }: StudyProps & UserSessionProps) => {
  const userRole = getAccountRoleOnStudy(user, study)
  if (!userRole) {
    return <NotFound />
  }
  return <StudyContributionPage study={study} userRole={userRole} environment={user.environment} />
}

export default withAuth(withStudyDetails(DataEntry))
