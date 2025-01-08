import withAuth from '@/components/hoc/withAuth'
import { StudyProps } from '@/components/hoc/withStudy'
import withStudyDetails from '@/components/hoc/withStudyDetails'
import StudyPage from '@/components/pages/Study'

const StudyView = async ({ study }: StudyProps) => {
  return <StudyPage study={study} />
}

export default withAuth(withStudyDetails(StudyView))
