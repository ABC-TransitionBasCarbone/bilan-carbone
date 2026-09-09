import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import withStudyDetails, { StudyProps } from '@/components/hoc/withStudyDetails'
import StudyRightsPage from '@/components/pages/StudyRights'

export const revalidate = 0

const StudyRights = async (props: StudyProps & UserSessionProps) => {
  return <StudyRightsPage study={props.study} user={props.user} />
}

export default withAuth(withStudyDetails(StudyRights))
