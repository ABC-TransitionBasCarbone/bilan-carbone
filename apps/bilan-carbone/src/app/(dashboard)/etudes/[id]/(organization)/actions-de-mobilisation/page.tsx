import withAuth from '@/components/hoc/withAuth'
import withStudyDetails, { StudyProps } from '@/components/hoc/withStudyDetails'
import EngagementActionsPage from '@/components/pages/EngagementActionsPage'
import { getEngagementActionsWithStudyId } from '@/services/serverFunctions/study'
import NotFound from '@abc-transitionbascarbone/components/src/pages/NotFound'

const EngagementActions = async ({ study }: StudyProps) => {
  const actions = await getEngagementActionsWithStudyId(study.id)

  if (!actions.success) {
    return <NotFound />
  }

  return <EngagementActionsPage study={study} actions={actions.data} />
}

export default withAuth(withStudyDetails(EngagementActions))
