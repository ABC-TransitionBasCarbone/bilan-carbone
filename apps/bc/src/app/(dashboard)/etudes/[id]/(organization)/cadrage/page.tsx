import NEWWithStudyDetails, { NEWStudyProps } from '@/components/hoc/NEWWithStudyDetails'
import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import StudyRightsPage from '@/components/pages/StudyRights'

export const revalidate = 0

const StudyRights = async (props: NEWStudyProps & UserSessionProps) => {
  return <StudyRightsPage user={props.user} minimalStudy={props.minimalStudy} />
}

export default withAuth(NEWWithStudyDetails(StudyRights))
