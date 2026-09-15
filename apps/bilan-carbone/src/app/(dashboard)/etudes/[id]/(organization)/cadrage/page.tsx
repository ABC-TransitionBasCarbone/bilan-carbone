import NEWWithStudyDetails from '@/components/hoc/NEWWithStudyDetails'
import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import { StudyProps } from '@/components/hoc/withStudyDetails'
import StudyRightsPage from '@/components/pages/StudyRights'

export const revalidate = 0

const StudyRights = async (props: StudyProps & UserSessionProps) => {
  return <StudyRightsPage user={props.user} minimalStudy={props.minimalStudy} />
}

export default withAuth(NEWWithStudyDetails(StudyRights))
