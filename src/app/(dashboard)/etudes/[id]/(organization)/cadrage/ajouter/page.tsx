import withAuth, { UserProps } from '@/components/hoc/withAuth'
import withStudy, { StudyProps } from '@/components/hoc/withStudy'
import NewStudyRightPage from '@/components/pages/NewStudyRight'

const NewStudyRight = async (props: StudyProps & UserProps) => {
  return <NewStudyRightPage study={props.study} user={props.user} />
}

export default withAuth(withStudy(NewStudyRight))
