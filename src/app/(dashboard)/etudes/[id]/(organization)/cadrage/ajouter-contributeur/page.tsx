import withAuth from '@/components/hoc/withAuth'
import { StudyProps } from '@/components/hoc/withStudy'
import withStudyNotContributor from '@/components/hoc/withStudyNotContributor'
import NewStudyContributorPage from '@/components/pages/NewStudyContributor'

const NewStudyContributor = async ({ study }: StudyProps) => {
  return <NewStudyContributorPage study={study} />
}

export default withAuth(withStudyNotContributor(NewStudyContributor))
