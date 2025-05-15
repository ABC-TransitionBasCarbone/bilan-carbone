import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import { StudyProps } from '@/components/hoc/withStudy'
import withStudyDetails from '@/components/hoc/withStudyDetails'
import StudyPage from '@/components/pages/Study'

const StudyView = async ({ study, user }: StudyProps & UserSessionProps) => {
  return <StudyPage study={study} user={user} />
}

export default withAuth(withStudyDetails(StudyView))
