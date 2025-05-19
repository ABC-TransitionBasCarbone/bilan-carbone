import withAuth, { UserProps } from '@/components/hoc/withAuth'
import { StudyProps } from '@/components/hoc/withStudy'
import withStudyDetails from '@/components/hoc/withStudyDetails'
import NotFound from '@/components/pages/NotFound'
import StudyContributionPage from '@/components/pages/StudyContribution'
import { getUserRoleOnStudy } from '@/utils/study'

const DataEntry = async ({ study, user }: StudyProps & UserProps) => {
  const userRole = getUserRoleOnStudy(user, study)
  if (!userRole) {
    return <NotFound />
  }
  return <StudyContributionPage study={study} userRole={userRole} />
}

export default withAuth(withStudyDetails(DataEntry))
