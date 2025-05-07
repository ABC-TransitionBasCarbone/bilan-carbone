import withAuth, { UserProps } from '@/components/hoc/withAuth'
import { StudyProps } from '@/components/hoc/withStudy'
import withStudyDetails from '@/components/hoc/withStudyDetails'
import StudyPage from '@/components/pages/Study'

const StudyView = async ({ study, user }: StudyProps & UserProps) => {
  return <StudyPage study={study} user={user} />
}

export default withAuth(withStudyDetails(StudyView))
