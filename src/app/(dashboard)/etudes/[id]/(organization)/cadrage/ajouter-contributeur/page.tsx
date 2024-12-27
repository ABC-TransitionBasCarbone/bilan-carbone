import withAuth, { UserProps } from '@/components/hoc/withAuth'
import withStudy, { StudyProps } from '@/components/hoc/withStudy'
import NewStudyContributorPage from '@/components/pages/NewStudyContributor'

const NewStudyContributor = async (props: StudyProps & UserProps) => {
  return <NewStudyContributorPage study={props.study} />
}

export default withAuth(withStudy(NewStudyContributor))
