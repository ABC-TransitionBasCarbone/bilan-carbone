import withAuth, { UserProps } from '@/components/hoc/withAuth'
import { StudyProps } from '@/components/hoc/withStudy'
import withStudyDetails from '@/components/hoc/withStudyDetails'
import NewStudyRightPage from '@/components/pages/NewStudyRight'

const NewStudyRight = async (props: StudyProps & UserProps) => {
  return <NewStudyRightPage study={props.study} user={props.user} />
}

export default withAuth(withStudyDetails(NewStudyRight))
