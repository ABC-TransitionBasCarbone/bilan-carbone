import withAuth from '@/components/hoc/withAuth'
import withStudyNotContributor, { StudyProps } from '@/components/hoc/withStudyNotContributor'
import StudyContributionPage from '@/components/pages/StudyContribution'

const DataEntry = async ({ study }: StudyProps) => {
  return <StudyContributionPage study={study} />
}

export default withAuth(withStudyNotContributor(DataEntry))
