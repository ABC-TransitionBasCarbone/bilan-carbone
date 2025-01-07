import withAuth, { UserProps } from '@/components/hoc/withAuth'
import { StudyProps } from '@/components/hoc/withStudy'
import withStudyNotContributor from '@/components/hoc/withStudyNotContributor'
import StudyPerimeterPage from '@/components/pages/StudyPerimeter'

const StudyPerimeter = async (props: StudyProps & UserProps) => {
  return <StudyPerimeterPage study={props.study} user={props.user} />
}

export default withAuth(withStudyNotContributor(StudyPerimeter))
