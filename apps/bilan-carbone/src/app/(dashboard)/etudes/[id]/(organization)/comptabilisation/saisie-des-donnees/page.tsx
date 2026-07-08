import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import { StudyProps } from '@/components/hoc/withStudy'
import withStudyDetails from '@/components/hoc/withStudyDetails'
import StudyContributionPage from '@/components/pages/StudyContribution'
import { getAccountRoleOnStudy } from '@/utils/study'
import NotFound from '@abc-transitionbascarbone/components/src/pages/NotFound'

const DataEntry = async ({ study, user }: StudyProps & UserSessionProps) => {
  const userRole = getAccountRoleOnStudy(user, study)
  if (!userRole) {
    return <NotFound />
  }
  return <StudyContributionPage study={study} userRole={userRole} user={user} />
}

export default withAuth(withStudyDetails(DataEntry))
