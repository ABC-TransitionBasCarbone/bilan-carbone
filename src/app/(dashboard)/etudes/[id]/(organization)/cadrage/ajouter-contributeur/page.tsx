import withAuth from '@/components/hoc/withAuth'
import withStudy, { StudyProps } from '@/components/hoc/withStudy'
import NewStudyContributorPage from '@/components/pages/NewStudyContributor'

const NewStudyContributor = async ({ study }: StudyProps) => {
  return <NewStudyContributorPage study={study} />
}

export default withAuth(withStudy(NewStudyContributor))
