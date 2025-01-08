import withAuth from '@/components/hoc/withAuth'
import { StudyProps } from '@/components/hoc/withStudy'
import withStudyDetails from '@/components/hoc/withStudyDetails'
import StudyContributionPage from '@/components/pages/StudyContribution'

const DataEntry = async ({ study }: StudyProps) => {
  return <StudyContributionPage study={study} />
}

export default withAuth(withStudyDetails(DataEntry))
