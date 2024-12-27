import withAuth, { UserProps } from '@/components/hoc/withAuth'
import withStudy, { StudyProps } from '@/components/hoc/withStudy'
import StudyPerimeterPage from '@/components/pages/StudyPerimeter'

const StudyPerimeter = async (props: StudyProps & UserProps) => {
  return <StudyPerimeterPage study={props.study} user={props.user} />
}

export default withAuth(withStudy(StudyPerimeter))
