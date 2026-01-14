import withAuth from '@/components/hoc/withAuth'
import { StudyProps } from '@/components/hoc/withStudy'
import withStudyDetails from '@/components/hoc/withStudyDetails'
import EngagementActionsPage from '@/components/pages/EngagementActionsPage'
import NotFound from '@/components/pages/NotFound'
import { getEngagementActionsWithStudyId } from '@/services/serverFunctions/study'

const EngagementActions = async ({ study }: StudyProps) => {
  const actions = await getEngagementActionsWithStudyId(study.id)

  if (!actions.success) {
    return <NotFound />
  }

  return <EngagementActionsPage study={study} actions={actions.data} />
}

export default withAuth(withStudyDetails(EngagementActions))
